'use strict';

var _ = require('lodash');

class DbCriteria {
  constructor(criteria) {
    this._criteria = criteria || {};
    this._criteria.where = this._criteria.where || [];
    this._criteria.order = this._criteria.order || {};
    this._criteria.offset = this._criteria.offset !== void(0) ? this._criteria.offset : 0;
  }

  _constructWhereCondition(key, value, operator, or) {
    return {
      key: key,
      value: value,
      operator: operator,
      or: !!or
    };
  }

  _addWhereCondition(key, value, or) {
    if (key instanceof DbCriteria) {
      let condition = {
        where: key.getWhere(),
        or: !!or
      };
      this._criteria.where.push(condition);
      return this;
    }

    let operator = 'eq';
    if (_.isObject(value)) {
      let pair =  _.pairs(value)[0];
      operator = pair[0];
      value = pair[1];
    }

    let condition = this._constructWhereCondition(key, value, operator, or);

    let currentCondition = _.findWhere(this.getWhere(), {
      key: condition.key
    });

    if (currentCondition) {
      _.extend(currentCondition, condition);
    } else {
      this._criteria.where.push(condition);
    }

    return this;
  }

  where(key, value, or) {
    if (key instanceof DbCriteria) {
      or = value;
      this._addWhereCondition(key, null, or);
    } else if (_.isObject(key)) {
      or = value;
      _.forEach(key, (v, k) => {
        this._addWhereCondition(k, v, or);
      });
    } else {
      this._addWhereCondition(key, value, or);
    }

    return this;
  }

  getWhere() {
    return _.clone(this._criteria.where);
  }

  fields(...params) {
    params = _.flatten(params);
    this._criteria.fields = _.chain(this._criteria.fields || []).union(params).uniq().value();
    return this;
  }

  getFields() {
    return _.clone(this._criteria.fields);
  }

  order(key, direction) {
    this._criteria.order[key] = !!direction;
    return this;
  }

  getOrder() {
    return _.clone(this._criteria.order);
  }

  offset(offset) {
    this._criteria.offset = offset;
    return this;
  }

  getOffset() {
    return this._criteria.offset;
  }

  limit(limit) {
    this._criteria.limit = limit;
  }

  getLimit() {
    return this._criteria.limit;
  }
}

var comparisons = [
  'gt',
  'gte',
  'lt',
  'lte',
  'neq',
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
