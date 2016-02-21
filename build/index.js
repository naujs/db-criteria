'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _ = require('lodash');

var DbCriteria = function () {
  function DbCriteria() {
    var criteria = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
    var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    _classCallCheck(this, DbCriteria);

    this._useOrByDefault = options.useOrByDefault;

    this._criteria = {};
    this._initWhereCondition(criteria.where);
    this._criteria.order = criteria.order || {};
    this._criteria.offset = criteria.offset !== void 0 ? criteria.offset : 0;
    this._criteria.limit = criteria.limit;
  }

  _createClass(DbCriteria, [{
    key: '_initWhereCondition',
    value: function _initWhereCondition(where) {
      var _this = this;

      this._criteria.where = this._criteria.where || [];

      if (!where) {
        return;
      }

      _.each(where, function (value, key) {
        if (key == 'and') {
          if (!_.isArray(value)) {
            value = [value];
          }

          var andCondition = new DbCriteria();

          _.each(value, function (v) {
            andCondition.where(v);
          });

          _this.where(andCondition, !!_this._useOrByDefault);
        } else if (key == 'or') {
          if (!_.isArray(value)) {
            value = [value];
          }

          var orCondition = new DbCriteria({}, {
            useOrByDefault: true
          });

          _.each(value, function (v) {
            orCondition.where(v, true);
          });

          _this.where(orCondition, !!_this._useOrByDefault);
        } else {
          _this.where(key, value);
        }
      });
    }
  }, {
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
      var _this2 = this;

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

      // When value is an array, this means that there are multiple conditions
      // for this attribute, the conditions must be formatted to object
      if (_.isArray(value)) {
        var comparisons = {};
        _.each(value, function (v) {
          var pair = _.pairs(v)[0];
          comparisons[pair[0]] = pair[1];
        });
        comparisons['or'] = !!or;
        value = comparisons;
      }

      // value can be an object for using extra operators
      // For example:
      // {
      //    'gte': 1,
      //    'lt': 10
      // }
      // By default, the join (OR/AND) between each operator is determined by
      // the arg `or` passed in `where` unless specifically provided `or` param
      // in the value
      if (_.isObject(value)) {
        _.each(value, function (v, operator) {
          if (operator == 'or') {
            return;
          }

          var _or = value.or === void 0 ? !!or : value.or;
          var condition = _this2._constructWhereCondition(key, v, operator, _or);
          _this2._criteria.where.push(condition);
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
      var _this3 = this;

      if (this._useOrByDefault && or === void 0) {
        or = true;
      }

      if (key instanceof DbCriteria) {
        or = value;
        this._addWhereCondition(key, null, or);
      } else if (_.isObject(key)) {
        or = value;
        _.forEach(key, function (v, k) {
          if (k == 'and' || k == 'or') {
            var _where = {};
            _where[k] = v;
            _this3._initWhereCondition(_where);
          } else {
            _this3._addWhereCondition(k, v, or);
          }
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
      var _this4 = this;

      var order = {};
      if (_.isObject(key)) {
        order = key;
      } else {
        order[key] = direction;
      }

      _.each(order, function (d, k) {
        _this4._criteria.order[k] = !!d;
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