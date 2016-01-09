'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _ = require('lodash');

var DbCriteria = function () {
  function DbCriteria(criteria) {
    _classCallCheck(this, DbCriteria);

    this._criteria = criteria || {};
    this._criteria.where = this._criteria.where || [];
    this._criteria.order = this._criteria.order || {};
    this._criteria.offset = this._criteria.offset !== void 0 ? this._criteria.offset : 0;
  }

  _createClass(DbCriteria, [{
    key: '_constructWhereCondition',
    value: function _constructWhereCondition(key, value, operator, or) {
      return {
        key: key,
        value: value,
        operator: operator,
        or: !!or
      };
    }
  }, {
    key: '_addWhereCondition',
    value: function _addWhereCondition(key, value, or) {
      var _this = this;

      // If an instance of DbCriteria is passed,
      // it should become a nested query
      if (key instanceof DbCriteria) {
        var condition = {
          where: key.getWhere(),
          or: !!or
        };
        this._criteria.where.push(condition);
        return this;
      }

      // value can be an object for using extra operators
      // For example:
      // {
      //    'gte': 1,
      //    'lt': 10
      // }
      // By default the operators will be treated as AND. Specifying
      // or = true will change it to OR
      // TODO: support array, not sure how it should be?
      if (_.isObject(value)) {
        _.each(value, function (v, operator) {
          if (operator == 'or') {
            return;
          }

          var condition = _this._constructWhereCondition(key, v, operator, value.or);
          _this._criteria.where.push(condition);
        });
      } else {
        // The default operator is equal
        var condition = this._constructWhereCondition(key, value, 'eq', or);
        this._criteria.where.push(condition);
      }

      return this;
    }
  }, {
    key: 'where',
    value: function where(key, value, or) {
      var _this2 = this;

      if (key instanceof DbCriteria) {
        or = value;
        this._addWhereCondition(key, null, or);
      } else if (_.isObject(key)) {
        or = value;
        _.forEach(key, function (v, k) {
          _this2._addWhereCondition(k, v, or);
        });
      } else {
        this._addWhereCondition(key, value, or);
      }

      return this;
    }
  }, {
    key: 'getWhere',
    value: function getWhere() {
      return _.clone(this._criteria.where);
    }
  }, {
    key: 'fields',
    value: function fields() {
      for (var _len = arguments.length, params = Array(_len), _key = 0; _key < _len; _key++) {
        params[_key] = arguments[_key];
      }

      params = _.flatten(params);
      this._criteria.fields = _.chain(this._criteria.fields || []).union(params).uniq().value();
      return this;
    }
  }, {
    key: 'getFields',
    value: function getFields() {
      return _.clone(this._criteria.fields);
    }
  }, {
    key: 'order',
    value: function order(key, direction) {
      var _this3 = this;

      var order = {};
      if (_.isObject(key)) {
        order = key;
      } else {
        order[key] = direction;
      }

      _.each(order, function (d, k) {
        _this3._criteria.order[k] = !!d;
      });

      return this;
    }
  }, {
    key: 'getOrder',
    value: function getOrder() {
      return _.clone(this._criteria.order);
    }
  }, {
    key: 'offset',
    value: function offset(_offset) {
      this._criteria.offset = _offset;
      return this;
    }
  }, {
    key: 'getOffset',
    value: function getOffset() {
      return this._criteria.offset;
    }
  }, {
    key: 'limit',
    value: function limit(_limit) {
      this._criteria.limit = _limit;
    }
  }, {
    key: 'getLimit',
    value: function getLimit() {
      return this._criteria.limit;
    }
  }]);

  return DbCriteria;
}();

var comparisons = ['gt', 'gte', 'lt', 'lte', 'neq', 'in', 'nin'];

_.each(comparisons, function (comparison) {
  DbCriteria.prototype[comparison] = function (value) {
    var comp = {};
    comp[comparison] = value;
    return comp;
  };
});

module.exports = DbCriteria;