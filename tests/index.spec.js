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
          operator: 'gte',
          or: false
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

});
