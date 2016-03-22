'use strict';

var DbCriteria = require('../')
  , ActiveRecord = require('@naujs/active-record')
  , Registry = require('@naujs/registry')
  , _ = require('lodash');

class Store extends ActiveRecord {}
Store.properties = {
  name: {
    type: ActiveRecord.Types.string
  }
};
Store.relations = {
  products: {
    type: 'hasMany',
    model: 'Product',
    foreignKey: 'store_id'
  }
};

class Product extends ActiveRecord {}
Product.properties = {
  name: {
    type: ActiveRecord.Types.string
  }
};

Product.relations = {
  'comments': {
    type: 'hasMany',
    model: 'Comment',
    foreignKey: 'product_id'
  },
  'store': {
    type: 'belongsTo',
    model: 'Store',
    foreignKey: 'store_id'
  },
  'tags': {
    type: 'hasManyAndBelongsTo',
    model: 'Tag',
    through: 'ProductTag',
    foreignKey: 'product_id'
  }
};

class Comment extends ActiveRecord {}
Comment.properties = {
  content: {
    type: ActiveRecord.Types.string
  }
};
Comment.relations = {
  'author': {
    type: 'belongsTo',
    model: 'User',
    foreignKey: 'user_id'
  },
  'votes': {
    type: 'hasMany',
    model: 'Vote',
    foreignKey: 'comment_id'
  }
};

class Tag extends ActiveRecord {}
Tag.properties = {
  name: {
    type: ActiveRecord.Types.string
  }
};

class ProductTag extends ActiveRecord {}
ProductTag.relations = {
  'product': {
    type: 'belongsTo',
    model: 'Product',
    foreignKey: 'product_id'
  },
  'tag': {
    type: 'belongsTo',
    model: 'Tag',
    foreignKey: 'tag_id'
  }
};

class User extends ActiveRecord {}
User.properties = {
  name: {
    type: ActiveRecord.Types.string
  }
};
User.relations = {
  'comments': {
    type: 'hasMany',
    model: 'Comment',
    foreignKey: 'user_id'
  },
  'votes': {
    type: 'hasMany',
    model: 'Vote',
    foreignKey: 'user_id'
  }
};

class Vote extends ActiveRecord {}
Vote.properties = {
  rating: {
    type: ActiveRecord.Types.number
  }
};

Vote.relations = {
  comment: {
    type: 'belongsTo',
    model: 'Comment',
    foreignKey: 'comment_id'
  },
  author: {
    type: 'belongsTo',
    model: 'User',
    foreignKey: 'user_id'
  }
};

Registry.setModel(Store);
Registry.setModel(Product);
Registry.setModel(Comment);
Registry.setModel(Tag);
Registry.setModel(User);
Registry.setModel(Vote);
Registry.setModel(ProductTag);

describe('DbCriteria', () => {
  var criteria;

  function expectWhere(where) {
    expect(criteria.getWhere()).toEqual(where);
  }

  function expectInclude(include) {
    expect(criteria.getInclude()).toEqual(include);
  }

  beforeEach(() => {
    criteria = new DbCriteria(Product);
  });

  describe('constructor', () => {
    it('should allow to set limit, offset, order, include', () => {
      criteria = new DbCriteria(Product, {
        limit: 10,
        offset: 20,
        order: {
          a: true,
          b: false
        },
        include: 'test1'
      });

      expect(criteria.getLimit()).toEqual(10);
      expect(criteria.getOffset()).toEqual(20);
      expect(criteria.getOrder()).toEqual({
        a: true,
        b: false
      });
      // expectInclude([
      //   {
      //     relation: 'test1'
      //   }
      // ]);
    });

    it('should construct where conditions', () => {
      criteria = new DbCriteria(Product, {
        where: {
          a: 1,
          b: 2
        }
      });

      expectWhere([
        {
          key: 'a',
          value: 1,
          operator: 'eq',
          or: false
        },
        {
          key: 'b',
          value: 2,
          operator: 'eq',
          or: false
        }
      ]);
    });

    it('should support and grouping', () => {
      criteria = new DbCriteria(Product, {
        where: {
          and: {
            a: 1,
            b: 2
          }
        }
      });

      expectWhere([
        {
          where: [
            {
              key: 'a',
              value: 1,
              operator: 'eq',
              or: false
            },
            {
              key: 'b',
              value: 2,
              operator: 'eq',
              or: false
            }
          ],
          or: false
        }
      ]);
    });

    it('should support and grouping and normal conditions', () => {
      criteria = new DbCriteria(Product, {
        where: {
          and: {
            a: 1,
            b: 2
          },
          c: 3,
          d: 4
        }
      });

      expectWhere([
        {
          where: [
            {
              key: 'a',
              value: 1,
              operator: 'eq',
              or: false
            },
            {
              key: 'b',
              value: 2,
              operator: 'eq',
              or: false
            }
          ],
          or: false
        },
        {
          key: 'c',
          value: 3,
          operator: 'eq',
          or: false
        },
        {
          key: 'd',
          value: 4,
          operator: 'eq',
          or: false
        }
      ]);
    });

    it('should support or grouping', () => {
      criteria = new DbCriteria(Product, {
        where: {
          or: {
            a: 1,
            b: 2
          }
        }
      });

      expectWhere([
        {
          where: [
            {
              key: 'a',
              value: 1,
              operator: 'eq',
              or: true
            },
            {
              key: 'b',
              value: 2,
              operator: 'eq',
              or: true
            }
          ],
          or: false
        }
      ]);
    });

    it('should support or grouping and normal conditions', () => {
      criteria = new DbCriteria(Product, {
        where: {
          or: {
            a: 1,
            b: 2
          },
          c: 3,
          d: 4
        }
      });

      expectWhere([
        {
          where: [
            {
              key: 'a',
              value: 1,
              operator: 'eq',
              or: true
            },
            {
              key: 'b',
              value: 2,
              operator: 'eq',
              or: true
            }
          ],
          or: false
        },
        {
          key: 'c',
          value: 3,
          operator: 'eq',
          or: false
        },
        {
          key: 'd',
          value: 4,
          operator: 'eq',
          or: false
        }
      ]);
    });

    it('should support or grouping and normal conditions in any order', () => {
      criteria = new DbCriteria(Product, {
        where: {
          c: 3,
          or: {
            a: 1,
            b: 2
          },
          d: 4
        }
      });

      expectWhere([
        {
          key: 'c',
          value: 3,
          operator: 'eq',
          or: false
        },
        {
          where: [
            {
              key: 'a',
              value: 1,
              operator: 'eq',
              or: true
            },
            {
              key: 'b',
              value: 2,
              operator: 'eq',
              or: true
            }
          ],
          or: false
        },
        {
          key: 'd',
          value: 4,
          operator: 'eq',
          or: false
        }
      ]);
    });

    it('should support nested grouping conditions', () => {
      criteria = new DbCriteria(Product, {
        where: {
          or: {
            and: {
              a: 1,
              b: 2
            },
            c: 3
          }
        }
      });

      expectWhere([
        {
          where: [
            {
              where: [
                {
                  key: 'a',
                  value: 1,
                  operator: 'eq',
                  or: false
                },
                {
                  key: 'b',
                  value: 2,
                  operator: 'eq',
                  or: false
                }
              ],
              or: true
            },
            {
              key: 'c',
              value: 3,
              operator: 'eq',
              or: true
            }
          ],
          or: false
        }
      ]);
    });

    it('should support nested grouping conditions in any order', () => {
      criteria = new DbCriteria(Product, {
        where: {
          or: {
            c: 3,
            and: {
              a: 1,
              b: 2
            }
          }
        }
      });

      expectWhere([
        {
          where: [
            {
              key: 'c',
              value: 3,
              operator: 'eq',
              or: true
            },
            {
              where: [
                {
                  key: 'a',
                  value: 1,
                  operator: 'eq',
                  or: false
                },
                {
                  key: 'b',
                  value: 2,
                  operator: 'eq',
                  or: false
                }
              ],
              or: true
            }
          ],
          or: false
        }
      ]);
    });

    it('should support or conditions for the same property', () => {
      criteria = new DbCriteria(Product, {
        where: {
          or: [
            {a: 1},
            {a: {gt: 2}}
          ]
        }
      });

      expectWhere([
        {
          where: [
            {
              key: 'a',
              value: 1,
              operator: 'eq',
              or: true
            },
            {
              key: 'a',
              value: 2,
              operator: 'gt',
              or: true
            }
          ],
          or: false
        }
      ]);
    });

  });

  describe('#where', () => {
    it('should generate and condition by default', () => {
      criteria.where('a', 1);
      criteria.where('b', 2);

      expectWhere([
        {
          key: 'a',
          value: 1,
          operator: 'eq',
          or: false
        },
        {
          key: 'b',
          value: 2,
          operator: 'eq',
          or: false
        }
      ]);
    });

    it('should support object', () => {
      criteria.where({
        a: 1,
        b: 2
      });

      expectWhere([
        {
          key: 'a',
          value: 1,
          operator: 'eq',
          or: false
        },
        {
          key: 'b',
          value: 2,
          operator: 'eq',
          or: false
        }
      ]);
    });

    it('should support `or`', () => {
      criteria.where('a', 1);
      criteria.where('b', 2, true);

      expectWhere([
        {
          key: 'a',
          value: 1,
          operator: 'eq',
          or: false
        },
        {
          key: 'b',
          value: 2,
          operator: 'eq',
          or: true
        }
      ]);
    });

    it('should support special comparison methods', () => {
      criteria.where('a', criteria.lt(10));

      expectWhere([
        {
          key: 'a',
          value: 10,
          operator: 'lt',
          or: false
        }
      ]);

      criteria.where('a', criteria.gte(10));

      expectWhere([
        {
          key: 'a',
          value: 10,
          operator: 'lt',
          or: false
        },
        {
          key: 'a',
          value: 10,
          operator: 'gte',
          or: false
        }
      ]);
    });

    it('should support array of conditions using AND', () => {
      criteria.where('a', [
        criteria.lt(10),
        criteria.gt(100)
      ]);

      expectWhere([
        {
          key: 'a',
          value: 10,
          operator: 'lt',
          or: false
        },
        {
          key: 'a',
          value: 100,
          operator: 'gt',
          or: false
        }
      ]);
    });

    it('should support array of conditions using OR', () => {
      criteria.where('a', [
        criteria.lt(10),
        criteria.gt(100)
      ], true);

      expectWhere([
        {
          key: 'a',
          value: 10,
          operator: 'lt',
          or: true
        },
        {
          key: 'a',
          value: 100,
          operator: 'gt',
          or: true
        }
      ]);
    });

    it('should support nested criteria', () => {
      var nestedCriteria = new DbCriteria(Product);
      nestedCriteria.where('a', 1);
      nestedCriteria.where('b', 2);

      criteria.where('c', 3);
      criteria.where(nestedCriteria, true);

      expectWhere([
        {
          key: 'c',
          value: 3,
          operator: 'eq',
          or: false
        },
        {
          where: [
            {
              key: 'a',
              value: 1,
              operator: 'eq',
              or: false
            },
            {
              key: 'b',
              value: 2,
              operator: 'eq',
              or: false
            }
          ],
          or: true
        }
      ]);
    });

    it('should allow to specify or as the default logic in where conditions', () => {
      criteria = new DbCriteria(Product, {}, {useOrByDefault: true});

      criteria.where('a', 1);
      criteria.where('b', 2);

      expectWhere([
        {
          key: 'a',
          value: 1,
          operator: 'eq',
          or: true
        },
        {
          key: 'b',
          value: 2,
          operator: 'eq',
          or: true
        }
      ]);
    });

  });

  describe('#fields', () => {
    it('should remove duplicated fields', () => {
      criteria.fields('a', 'b', 'a');
      expect(criteria.getFields()).toEqual(['a', 'b']);
    });

    it('should support array param', () => {
      criteria.fields(['a', 'b', 'a']);
      expect(criteria.getFields()).toEqual(['a', 'b']);
    });
  });

  describe('#order', () => {
    it('should store order', () => {
      criteria.order('a');
      expect(criteria.getOrder()).toEqual({
        a: false
      });

      criteria.order('a', true);
      expect(criteria.getOrder()).toEqual({
        a: true
      });

      criteria.order('b');
      expect(criteria.getOrder()).toEqual({
        a: true,
        b: false
      });
    });

    it('should support object param', () => {
      criteria.order({
        a: true,
        b: false,
        c: true
      });

      expect(criteria.getOrder()).toEqual({
        a: true,
        b: false,
        c: true
      });
    });
  });

  describe('#include', () => {
    it('should support string', () => {
      criteria.include('store');
      expectInclude([
        {
          relation: 'store',
          modelName: 'Product',
          type: 'belongsTo',
          properties: ['name', 'id', 'store_id'],
          through: null,
          target: {
            modelName: 'Store',
            foreignKey: 'store_id',
            referenceKey: 'id',
            properties: ['name', 'id'],
            criteria: null
          }
        }
      ]);
    });

    it('should support multiple relations', () => {
      criteria.include('store');
      criteria.include('comments');
      expectInclude([
        {
          relation: 'store',
          modelName: 'Product',
          type: 'belongsTo',
          properties: ['name', 'id', 'store_id'],
          through: null,
          target: {
            modelName: 'Store',
            foreignKey: 'store_id',
            referenceKey: 'id',
            properties: ['name', 'id'],
            criteria: null
          }
        },
        {
          relation: 'comments',
          modelName: 'Product',
          type: 'hasMany',
          properties: ['name', 'id', 'store_id'],
          through: null,
          target: {
            modelName: 'Comment',
            foreignKey: 'product_id',
            referenceKey: 'id',
            properties: ['content', 'id', 'user_id'],
            criteria: null
          }
        }
      ]);
    });

    it('should support filter for the relation', () => {
      criteria.include('store', {
        where: {
          name: 'test'
        },
        limit: 10
      });

      var _criteria = new DbCriteria(Store, {
        where: {
          name: 'test'
        },
        limit: 10
      });

      expectInclude([
        {
          relation: 'store',
          modelName: 'Product',
          type: 'belongsTo',
          properties: ['name', 'id', 'store_id'],
          through: null,
          target: {
            modelName: 'Store',
            foreignKey: 'store_id',
            referenceKey: 'id',
            properties: ['name', 'id'],
            criteria: _criteria
          }
        }
      ]);
    });

    it('should support nested relation in string format', () => {
      criteria.include('comments', {
        include: 'author'
      });

      var _criteria = new DbCriteria(Comment, {
        include: 'author'
      });

      expectInclude([
        {
          relation: 'comments',
          modelName: 'Product',
          type: 'hasMany',
          properties: ['name', 'id', 'store_id'],
          through: null,
          target: {
            modelName: 'Comment',
            foreignKey: 'product_id',
            referenceKey: 'id',
            properties: ['content', 'id', 'user_id'],
            criteria: _criteria
          }
        }
      ]);
    });

    function expectIncludeParam(include, expected) {
      expect(_.pick(include
        , 'relation'
        , 'modelName'
        , 'type'
        , 'properties')).toEqual(expected);
    }

    function expectIncludeTarget(target, expected) {
      expect(_.pick(target
        , 'foreignKey'
        , 'modelName'
        , 'referenceKey'
        , 'properties')).toEqual(expected);
    }

    it('support deeply nested relations', () => {
      criteria.include('comments', {
        include: {
          relation: 'votes',
          filter: {
            include: {
              relation: 'author',
              filter: {
                where: {
                  name: 'test'
                }
              }
            }
          }
        }
      });

      // first level
      expect(criteria.getInclude().length).toEqual(1);
      var include = criteria.getInclude()[0];
      expectIncludeParam(include, {
        relation: 'comments',
        modelName: 'Product',
        type: 'hasMany',
        properties: ['name', 'id', 'store_id']
      });

      var target = include.target;
      expectIncludeTarget(target, {
        foreignKey: 'product_id',
        modelName: 'Comment',
        referenceKey: 'id',
        properties: ['content', 'id', 'user_id']
      });

      // second level
      expect(target.criteria.getInclude().length).toEqual(1);
      include = target.criteria.getInclude()[0];
      expectIncludeParam(include, {
        relation: 'votes',
        modelName: 'Comment',
        type: 'hasMany',
        properties: ['content', 'id', 'user_id']
      });

      target = include.target;
      expectIncludeTarget(target, {
        foreignKey: 'comment_id',
        modelName: 'Vote',
        referenceKey: 'id',
        properties: ['rating', 'id', 'comment_id', 'user_id']
      });

      // third level
      expect(target.criteria.getInclude().length).toEqual(1);
      include = target.criteria.getInclude()[0];
      expectIncludeParam(include, {
        relation: 'author',
        modelName: 'Vote',
        type: 'belongsTo',
        properties: ['rating', 'id', 'comment_id', 'user_id']
      });

      target = include.target;
      expectIncludeTarget(target, {
        foreignKey: 'user_id',
        modelName: 'User',
        referenceKey: 'id',
        properties: ['name', 'id']
      });

      expect(target.criteria.getWhere()).toEqual([
        {
          key: 'name',
          value: 'test',
          operator: 'eq',
          or: false
        }
      ]);
    });

    it('should support many to many relationship', () => {
      criteria.include('tags');
      expectInclude([
        {
          relation: 'tags',
          modelName: 'Product',
          type: 'hasManyAndBelongsTo',
          properties: ['name', 'id', 'store_id'],
          target: {
            modelName: 'Tag',
            properties: ['name', 'id'],
            criteria: null,
            foreignKey: 'tag_id',
            referenceKey: 'id'
          },
          through: {
            modelName: 'ProductTag',
            foreignKey: 'product_id',
            referenceKey: 'id'
          }
        }
      ]);
    });
  });

  describe('#setAttributes', () => {
    it('should only set properties defined in the model', () => {
      criteria.setAttributes({
        name: 'ok',
        invalid: 'value'
      });

      expect(criteria.getAttributes()).toEqual({
        name: 'ok'
      });
    });

    it('should allow force option to set undefined properties', () => {
      criteria.setAttributes({
        name: 'ok',
        invalid: 'value'
      }, {
        force: true
      });

      expect(criteria.getAttributes()).toEqual({
        name: 'ok',
        invalid: 'value'
      });
    });

    it('should support an array of values', () => {
      criteria.setAttributes([
        {
          name: 'test1',
          invalid: 'value'
        },
        {
          name: 'test2',
          invalid: 'value'
        }
      ]);

      expect(criteria.getAttributes()).toEqual([
        {name: 'test1'},
        {name: 'test2'}
      ]);
    });
  });

});
