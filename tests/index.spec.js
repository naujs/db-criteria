var DbCriteria = require('../');

describe('DbCriteria', () => {
  var criteria;

  beforeEach(() => {
    criteria = new DbCriteria();
  });

  describe('#where', () => {
    function expectWhere(where) {
      expect(criteria.getWhere()).toEqual(where);
    }

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
