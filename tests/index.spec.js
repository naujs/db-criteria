var DbCriteria = require('../');

describe('DbCriteria', () => {
  var criteria;

  function expectWhere(where) {
    expect(criteria.getWhere()).toEqual(where);
  }

  beforeEach(() => {
    criteria = new DbCriteria();
  });

  describe('constructor', () => {
    it('should allow to set limit, offset, order', () => {
      criteria = new DbCriteria({
        limit: 10,
        offset: 20,
        order: {
          a: true,
          b: false
        }
      });

      expect(criteria.getLimit()).toEqual(10);
      expect(criteria.getOffset()).toEqual(20);
      expect(criteria.getOrder()).toEqual({
        a: true,
        b: false
      });
    });

    it('should construct where conditions', () => {
      criteria = new DbCriteria({
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
      criteria = new DbCriteria({
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
      criteria = new DbCriteria({
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
      criteria = new DbCriteria({
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
      criteria = new DbCriteria({
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
      criteria = new DbCriteria({
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
      criteria = new DbCriteria({
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
      criteria = new DbCriteria({
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
      criteria = new DbCriteria({
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
      var nestedCriteria = new DbCriteria();
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
      criteria = new DbCriteria({}, {useOrByDefault: true});

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

});
