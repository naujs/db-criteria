'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _ = require('lodash'),
    Registry = require('@naujs/registry');

var DbCriteria = (function () {
  function DbCriteria(instanceOrClass) {
    var filter = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
    var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

    _classCallCheck(this, DbCriteria);

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
    this._criteria.offset = filter.offset !== void 0 ? filter.offset : 0;
    this._criteria.limit = filter.limit;
    if (filter.include && !_.isEmpty(filter.include)) {
      this._initInclude(filter.include);
    }
    this._criteria.fields = filter.fields || [];

    this._filter = filter;
  }

  _createClass(DbCriteria, [{
    key: 'getModelClass',
    value: function getModelClass() {
      return this.Model;
    }
  }, {
    key: 'getModelInstance',
    value: function getModelInstance() {
      return this.modelInstance;
    }
  }, {
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

          var andCondition = new DbCriteria(_this.Model);

          _.each(value, function (v) {
            andCondition.where(v);
          });

          _this.where(andCondition, !!_this._useOrByDefault);
        } else if (key == 'or') {
          if (!_.isArray(value)) {
            value = [value];
          }

          var orCondition = new DbCriteria(_this.Model, {}, {
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
    key: '_initInclude',
    value: function _initInclude(include) {
      var _this2 = this;

      if (_.isString(include)) {
        this.include(include, null);
      } else if (_.isArray(include)) {
        // an array of relations
        // ['relatedModel1', {'relatedModel2': ['field1', 'field2']}]
        // ['relatedModel1', {'relatedModel2': {'where': {}}}]
        _.each(include, function (i) {
          if (_.isString(i)) {
            _this2.include(i, null);
          } else if (_.isObject(i) && !_.isArray(i)) {
            _.each(i, function (value, key) {
              var _filter = null;
              if (_.isArray(value)) {
                _filter.fields = value;
              } else if (_.isObject(value)) {
                _filter = value;
              }
              _this2.include(key, _filter);
            });
          }
        });
      } else if (_.isObject(include)) {
        // full form
        // {relation: 'relatedModel1', filter: {}}
        this.include(include.relation, include.filter);
      }
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
      var _this3 = this;

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
        _.each(value, function (v, operator) {
          if (operator == 'or') {
            return;
          }

          var _or = value.or === void 0 ? !!or : value.or;
          var condition = _this3._constructWhereCondition(key, v, operator, _or);
          _this3._criteria.where.push(condition);
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
    value: function where() {
      var key = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      var _this4 = this;

      var value = arguments[1];
      var or = arguments[2];

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
            _this4._initWhereCondition(_where);
          } else {
            _this4._addWhereCondition(k, v, or);
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

    // direction can be either 1 or -1
    // 1 is ASC
    // -1 is DESC

  }, {
    key: 'order',
    value: function order(key, direction) {
      var _this5 = this;

      if (!direction) {
        direction = 1;
      }

      var order = {};
      if (_.isObject(key)) {
        order = key;
      } else {
        order[key] = direction;
      }

      _.each(order, function (d, k) {
        _this5._criteria.order[k] = d;
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

    // criteria.include('comments', {where: {}, limit: 10})

  }, {
    key: 'include',
    value: function include(relationName, filter) {
      this._criteria.include = this._criteria.include || [];
      var Model = this.Model;
      var relation = Model.relations[relationName];
      if (!relation) {
        return this;
      }

      var RelatedModel = relation.modelClass || Registry.getModel(relation.model);
      if (!RelatedModel) {
        console.warn('Related model is not found for relation ' + relationName + ' of ' + Model.getModelName());
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
            console.warn('Failed to include many-to-many ' + relationName + ' relation without a through model ' + relation.through);
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

          var targetRelation = _.chain(ThroughModel.getRelations()).toPairs().find(function (pair) {
            var modelName = pair[1].modelClass ? pair[1].modelClass.getModelName() : pair[1].model;
            return modelName == target.modelName;
          }).value();

          if (!targetRelation) {
            console.warn('Can\'t find model for hasManyAndBelongsTo ' + relationName + ' relationship');
            return this;
          }

          var TargetModel = targetRelation[1].modelClass ? targetRelation[1].modelClass : Registry.getModel(targetRelation[1].model);

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
  }, {
    key: 'getInclude',
    value: function getInclude() {
      return this._criteria.include;
    }
  }, {
    key: '_checkModelProperties',
    value: function _checkModelProperties(attributes) {
      var properties = this.getModelClass().getAllProperties();
      return _.chain(attributes).toPairs().filter(function (pair) {
        return _.indexOf(properties, pair[0]) != -1;
      }).fromPairs().value();
    }

    // attributes are used for create/update queries
    // only those defined in the model are set

  }, {
    key: 'setAttributes',
    value: function setAttributes(attributes) {
      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      if (!options.force) {
        if (_.isArray(attributes)) {
          attributes = _.map(attributes, this._checkModelProperties.bind(this));
        } else {
          attributes = this._checkModelProperties(attributes);
        }
      }

      this._criteria.attributes = attributes;
    }
  }, {
    key: 'getAttributes',
    value: function getAttributes() {
      return this._criteria.attributes;
    }
  }, {
    key: 'getFilter',
    value: function getFilter() {
      return this._filter || {};
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