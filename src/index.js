'use strict';

var _ = require('lodash');


class DbCriteria {
  constructor(criteria = {}, options = {}) {
    this._useOrByDefault = options.useOrByDefault;

    this._criteria = {};
    this._initWhereCondition(criteria.where);
    this._criteria.order = criteria.order || {};
    this._criteria.offset = criteria.offset !== void(0) ?criteria.offset : 0;
    this._criteria.limit = criteria.limit;
    if (criteria.include) {
      this.include(criteria.include);
    }
  }

  _initWhereCondition(where) {
    this._criteria.where = this._criteria.where || [];

    if (!where) {
      return;
    }

    _.each(where, (value, key) => {
      if (key == 'and') {
        if (!_.isArray(value)) {
          value = [value];
        }

        var andCondition = new DbCriteria();

        _.each(value, (v) => {
          andCondition.where(v);
        });

        this.where(andCondition, !!this._useOrByDefault);
      } else if (key == 'or') {
        if (!_.isArray(value)) {
          value = [value];
        }

        var orCondition = new DbCriteria({}, {
          useOrByDefault: true
        });

        _.each(value, (v) => {
          orCondition.where(v, true);
        });

        this.where(orCondition, !!this._useOrByDefault);
      } else {
        this.where(key, value);
      }
    });
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
    // If an instance of DbCriteria is passed,
    // it should become a nested query
    if (key instanceof DbCriteria) {
      let condition = {
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
      _.each(value, (v) => {
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
      _.each(value, (v, operator) => {
        if (operator == 'or') {
          return;
        }

        let _or = value.or === void(0) ? !!or : value.or;
        let condition = this._constructWhereCondition(key, v, operator, _or);
        this._criteria.where.push(condition);
      });
    } else {
      // The default operator is equal
      let condition = this._constructWhereCondition(key, value, 'eq', or);
      this._criteria.where.push(condition);
    }

    return this;
  }

  where(key, value, or) {
    if (this._useOrByDefault && or === void(0)) {
      or = true;
    }

    if (key instanceof DbCriteria) {
      or = value;
      this._addWhereCondition(key, null, or);
    } else if (_.isObject(key)) {
      or = value;
      _.forEach(key, (v, k) => {
        if (k == 'and' || k == 'or') {
          let where = {};
          where[k] = v;
          this._initWhereCondition(where);
        } else {
          this._addWhereCondition(k, v, or);
        }
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
    var order = {};
    if (_.isObject(key)) {
      order = key;
    } else {
      order[key] = direction;
    }

    _.each(order, (d, k) => {
      this._criteria.order[k] = !!d;
    });

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

  include(relation) {
    this._criteria.include = this._criteria.include || [];
    if (_.isString(relation)) {
      // simple case: include('relatedModel');
      relation = {
        relation: relation
      };
      this._criteria.include.push(relation);
    } else if (_.isArray(relation)) {
      // an array of relations
      // include(['relatedModel1', {'relatedModel2': ['field1', 'field2']}])
      // include(['relatedModel1', {'relatedModel2': {'where': {}}}])
      _.each(relation, (r) => {
        this.include(r);
      });
    } else if (_.isObject(relation)) {
      // full form
      // include({relation: 'relatedModel1', filter: {}})
      if (relation.relation) {
        this._criteria.include.push(relation);
      } else {
        let keys = _.keys(relation);
        _.each(keys, (key) => {
          let r = relation[key];

          if (_.isArray(r)) {
            r = {
              relation: key,
              filter: {
                fields: r
              }
            };
          } else if (_.isObject(r)) {
            r = {
              relation: key,
              filter: r
            };
          } else {
            r = {
              relation: key,
              filter: {
                include: r
              }
            };
          }

          this._criteria.include.push(r);
        });
      }
    }

    return this;
  }

  getInclude() {
    return this._criteria.include;
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
