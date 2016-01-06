'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _ = require('lodash');

var DbCriteria = (function () {
  function DbCriteria(criteria) {
    _classCallCheck(this, DbCriteria);

    this._criteria = criteria || {};
    this._criteria.where = this._criteria.where || {};
  }

  _createClass(DbCriteria, [{
    key: 'where',
    value: function where(key, value, or) {
      var values = {};

      if (_.isObject(key)) {
        values = key;
      } else if (key) {
        values[key] = value;
      }

      if (or || values.or) {
        this._criteria.where.or = this._criteria.where.or || {};
        _.extend(this._criteria.where.or, values);
      } else if (values.and) {
        _.extend(this._criteria.where, values.and);
      } else {
        _.extend(this._criteria.where, values);
      }

      return this;
    }
  }]);

  return DbCriteria;
})();

var comparisons = ['gt', 'gte', 'lt', 'lte', 'ne', 'in', 'nin'];

_.each(comparisons, function (comparison) {
  DbCriteria.prototype[comparison] = function (value) {
    var comp = {};
    comp[comparison] = value;
    return comp;
  };
});

module.exports = DbCriteria;