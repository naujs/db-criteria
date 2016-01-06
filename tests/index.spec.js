var DbCriteria = require('../');

describe('DbCriteria', () => {
  describe('#where', () => {
    var criteria;

    function expectWhere(where) {
      expect(criteria._criteria.where).toEqual(where);
    }

    beforeEach(() => {
      criteria = new DbCriteria();
    });

    it('should generate and condition by default', () => {
      criteria.where('a', 1);
      criteria.where('b', 2);

      expectWhere({
        a: 1,
        b: 2
      });
    });

    it('should support object', () => {
      criteria.where({
        a: 1,
        b: 2
      });

      expectWhere({
        a: 1,
        b: 2
      });
    });

    it('should merge `and` params', () => {
      criteria.where({
        and: {
          a: 1,
          b: 2
        }
      });

      criteria.where({
        and: {
          c: 3,
          d: 4
        }
      });

      expectWhere({
        a: 1,
        b: 2,
        c: 3,
        d: 4
      });

      criteria.where('c', 9);

      expectWhere({
        a: 1,
        b: 2,
        c: 9,
        d: 4
      });
    });

    it('should merge `or` params', () => {
      criteria.where({
        a: 1,
        b: 2
      });

      criteria.where('c', 3, true);

      expectWhere({
        a: 1,
        b: 2,
        or: {
          c: 3
        }
      });

      criteria.where('d', 4, true);
      expectWhere({
        a: 1,
        b: 2,
        or: {
          c: 3,
          d: 4
        }
      });

      criteria.where('d', 5, true);
      expectWhere({
        a: 1,
        b: 2,
        or: {
          c: 3,
          d: 5
        }
      });
    });

    it('should support special comparison methods', () => {
      criteria.where('a', criteria.lt(10));

      expectWhere({
        a: {
          'lt': 10
        }
      });

      criteria.where('a', criteria.gte(10));

      expectWhere({
        a: {
          'gte': 10
        }
      });
    });
  });
});
