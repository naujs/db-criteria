'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _ = require('lodash');

var DbCriteria = (function () {
  function DbCriteria(criteria) {
    _classCallCheck(this, DbCriteria);

    this._criteria = criteria || {};
    this._criteria.where = this._criteria.where || [];
    this._criteria.order = this._criteria.order || {};
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
      if (key instanceof DbCriteria) {
        var _condition = {
          where: key.getWhere(),
          or: !!or
        };
        this._criteria.where.push(_condition);
        return this;
      }

      var operator = 'eq';
      if (_.isObject(value)) {
        var pair = _.pairs(value)[0];
        operator = pair[0];
        value = pair[1];
      }

      var condition = this._constructWhereCondition(key, value, operator, or);

      var currentCondition = _.findWhere(this.getWhere(), {
        key: condition.key
      });

      if (currentCondition) {
        _.extend(currentCondition, condition);
      } else {
        this._criteria.where.push(condition);
      }

      return this;
    }
  }, {
    key: 'where',
    value: function where(key, value, or) {
      var _this = this;

      if (key instanceof DbCriteria) {
        or = value;
        this._addWhereCondition(key, null, or);
      } else if (_.isObject(key)) {
        or = value;
        _.forEach(key, function (v, k) {
          _this._addWhereCondition(k, v, or);
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
      this._criteria.order[key] = !!direction;
      return this;
    }
  }, {
    key: 'getOrder',
    value: function getOrder() {
      return _.clone(this._criteria.order);
    }
  }]);

  return DbCriteria;
})();

var comparisons = ['gt', 'gte', 'lt', 'lte', 'neq', 'in', 'nin'];

_.each(comparisons, function (comparison) {
  DbCriteria.prototype[comparison] = function (value) {
    var comp = {};
    comp[comparison] = value;
    return comp;
  };
});

module.exports = DbCriteria;