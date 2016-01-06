'use strict';

var _ = require('lodash');

class DbCriteria {
  constructor(criteria) {
    this._criteria = criteria || {};
    this._criteria.where = this._criteria.where || {};
  }

  where(key, value, or) {
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
}

var comparisons = [
  'gt',
  'gte',
  'lt',
  'lte',
  'ne',
  'in',
  'nin'
];

_.each(comparisons, (comparison) => {
  DbCriteria.prototype[comparison] = (value) => {
    let comp = {};
    comp[comparison] = value;
    return comp;
  };
});

module.exports = DbCriteria;
