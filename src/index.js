'use strict';

var _ = require('lodash')
  , Registry = require('@naujs/registry');

class DbCriteria {
  constructor(instanceOrClass, filter = {}, options = {}) {
    if (_.isFunction(instanceOrClass.getClass)) {
      this.Model = instanceOrClass.getClass();
      this.modelInstance = instanceOrClass;
    } else {
      this.Model = instanceOrClass;
      this.modelInstance = null;
    }

    this._useOrByDefault = options.useOrByDefault;

    this._criteria = {};
    this._initWhereCondition(filter.where);
    this._criteria.order = filter.order || {};
    this._criteria.offset = filter.offset !== void(0) ? filter.offset : 0;
    this._criteria.limit = filter.limit;
    if (filter.include && !_.isEmpty(filter.include)) {
      this._initInclude(filter.include);
    }
  }

  getModelClass() {
    return this.Model;
  }

  getModelInstance() {
    return this.modelInstance;
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

        var andCondition = new DbCriteria(this.Model);

        _.each(value, (v) => {
          andCondition.where(v);
        });

        this.where(andCondition, !!this._useOrByDefault);
      } else if (key == 'or') {
        if (!_.isArray(value)) {
          value = [value];
        }

        var orCondition = new DbCriteria(this.Model, {}, {
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

  _initInclude(include) {
    if (_.isString(include)) {
      this.include(include, null);
    } else if (_.isArray(include)) {
      // an array of relations
      // ['relatedModel1', {'relatedModel2': ['field1', 'field2']}]
      // ['relatedModel1', {'relatedModel2': {'where': {}}}]
      _.each(include, (i) => {
        if (_.isString(i)) {
          this.include(i, null);
        } else if (_.isObject(i) && !_.isArray(i)) {
          _.each(i, (value, key) => {
            var _filter = null;
            if (_.isArray(value)) {
              _filter.fields = value;
            } else if (_.isObject(value)) {
              _filter = value;
            }
            this.include(key, _filter);
          });
        }
      });
    } else if (_.isObject(include)) {
      // full form
      // {relation: 'relatedModel1', filter: {}}
      this.include(include.relation, include.filter);
    }
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
        var pair = _.toPairs(v)[0];
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

  // criteria.include('comments', {where: {}, limit: 10})
  include(relationName, filter) {
    this._criteria.include = this._criteria.include || [];
    var Model = this.Model;
    var relation = Model.relations[relationName];
    if (!relation) {
      return this;
    }

    var RelatedModel = relation.modelClass || Registry.getModel(relation.model);
    if (!RelatedModel) {
      console.warn(`Related model is not found for relation ${relationName} of ${Model.getModelName()}`);
      return this;
    }

    var includeData = {
      relation: relationName,
      modelName: Model.getModelName(),
      type: relation.type,
      properties: Model.getAllProperties()
    };

    var target = {};
    var through = null;

    // Sample https://gist.github.com/laoshanlung/8a358d7bf0ec73bb91f2
    switch (relation.type) {
      case 'hasManyAndBelongsTo':
        var ThroughModel = Registry.getModel(relation.through);

        if (!ThroughModel) {
          console.warn(`Failed to include many-to-many ${relationName} relation without a through model ${relation.through}`);
          return this;
        }

        through = {
          modelName: ThroughModel.getModelName(),
          foreignKey: relation.foreignKey,
          referenceKey: relation.referenceKey || Model.getPrimaryKey()
        };

        target = {
          modelName: RelatedModel.getModelName(),
          properties: RelatedModel.getAllProperties(),
          criteria: filter ? new DbCriteria(RelatedModel, filter) : null
        };

        var targetRelation = _.chain(ThroughModel.getRelations()).toPairs().find((pair) => {
          var modelName = pair[1].modelClass ? pair[1].modelClass.getModelName() : pair[1].model;
          return modelName == target.modelName;
        }).value();

        if (!targetRelation) {
          console.warn(`Can't find model for hasManyAndBelongsTo ${relationName} relationship`);
          return this;
        }

        var TargetModel = targetRelation[1].modelClass
          ? targetRelation[1].modelClass
          : Registry.getModel(targetRelation[1].model);

        target.foreignKey = targetRelation[1].foreignKey;
        target.referenceKey = targetRelation[1].referenceKey || TargetModel.getPrimaryKey();
        break;
      default:
        target = {
          modelName: RelatedModel.getModelName(),
          foreignKey: relation.foreignKey,
          referenceKey: relation.referenceKey || Model.getPrimaryKey(),
          properties: RelatedModel.getAllProperties(),
          criteria: filter ? new DbCriteria(RelatedModel, filter) : null
        };
        break;
    }

    includeData.target = target;
    includeData.through = through;

    this._criteria.include.push(includeData);
    return this;
  }

  getInclude() {
    return this._criteria.include;
  }

  // attributes are used for create/update queries
  // only those defined in the model are set
  setAttributes(attributes) {
    var properties = this.getModelClass().getAllProperties();
    attributes = _.chain(attributes).toPairs().filter((pair) => {
      return _.indexOf(properties, pair[0]) != -1;
    }).fromPairs().value();

    this._criteria.attributes = attributes;
  }

  getAttributes() {
    return this._criteria.attributes;
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
