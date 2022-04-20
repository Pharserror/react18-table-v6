'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

exports.default = function (Base) {
  return function (_Base) {
    _inherits(_class, _Base);

    function _class(props) {
      _classCallCheck(this, _class);

      var _this = _possibleConstructorReturn(this, (_class.__proto__ || Object.getPrototypeOf(_class)).call(this, props));

      var defaultState = {
        page: props.defaultPage,
        pageSize: props.defaultPageSize,
        sorted: props.defaultSorted,
        expanded: props.defaultExpanded,
        filtered: props.defaultFiltered,
        resized: props.defaultResized,
        currentlyResizing: false,
        skipNextSort: false
      };
      var resolvedState = _this.getResolvedState(props, defaultState);
      var dataModel = _this.getDataModel(resolvedState, true);

      _this.state = _this.calculateNewResolvedState(dataModel);
      return _this;
    }

    _createClass(_class, [{
      key: 'UNSAFE_componentDidMount',
      value: function UNSAFE_componentDidMount() {
        this.fireFetchData();
      }
    }, {
      key: 'UNSAFE_componentDidUpdate',
      value: function UNSAFE_componentDidUpdate(prevProps, prevState) {
        var oldState = this.getResolvedState(prevProps, prevState);
        var newState = this.getResolvedState(this.props, this.state);

        // Do a deep compare of new and old `defaultOption` and
        // if they are different reset `option = defaultOption`
        var defaultableOptions = ['sorted', 'filtered', 'resized', 'expanded'];
        defaultableOptions.forEach(function (x) {
          var defaultName = 'default' + (x.charAt(0).toUpperCase() + x.slice(1));
          if (JSON.stringify(oldState[defaultName]) !== JSON.stringify(newState[defaultName])) {
            newState[x] = newState[defaultName];
          }
        });

        // If they change these table options, we need to reset defaults
        // or else we could get into a state where the user has changed the UI
        // and then disabled the ability to change it back.
        // e.g. If `filterable` has changed, set `filtered = defaultFiltered`
        var resettableOptions = ['sortable', 'filterable', 'resizable'];
        resettableOptions.forEach(function (x) {
          if (oldState[x] !== newState[x]) {
            var baseName = x.replace('able', '');
            var optionName = baseName + 'ed';
            var defaultName = 'default' + (optionName.charAt(0).toUpperCase() + optionName.slice(1));
            newState[optionName] = newState[defaultName];
          }
        });

        // Props that trigger a data update
        if (oldState.data !== newState.data || oldState.columns !== newState.columns || oldState.pivotBy !== newState.pivotBy || oldState.sorted !== newState.sorted || oldState.filtered !== newState.filtered) {
          this.setStateWithData(this.getDataModel(newState, oldState.data !== newState.data));
        }
      }
    }, {
      key: 'calculateNewResolvedState',
      value: function calculateNewResolvedState(dataModel) {
        var oldState = this.getResolvedState();
        var newResolvedState = this.getResolvedState({}, dataModel);
        var freezeWhenExpanded = newResolvedState.freezeWhenExpanded;

        // Default to unfrozen state

        newResolvedState.frozen = false;

        // If freezeWhenExpanded is set, check for frozen conditions
        if (freezeWhenExpanded) {
          // if any rows are expanded, freeze the existing data and sorting
          var keys = Object.keys(newResolvedState.expanded);
          for (var i = 0; i < keys.length; i += 1) {
            if (newResolvedState.expanded[keys[i]]) {
              newResolvedState.frozen = true;
              break;
            }
          }
        }

        // If the data isn't frozen and either the data or
        // sorting model has changed, update the data
        if (oldState.frozen && !newResolvedState.frozen || oldState.sorted !== newResolvedState.sorted || oldState.filtered !== newResolvedState.filtered || oldState.showFilters !== newResolvedState.showFilters || !newResolvedState.frozen && oldState.resolvedData !== newResolvedState.resolvedData) {
          // Handle collapseOnsortedChange & collapseOnDataChange
          if (oldState.sorted !== newResolvedState.sorted && this.props.collapseOnSortingChange || oldState.filtered !== newResolvedState.filtered || oldState.showFilters !== newResolvedState.showFilters || oldState.sortedData && !newResolvedState.frozen && oldState.resolvedData !== newResolvedState.resolvedData && this.props.collapseOnDataChange) {
            newResolvedState.expanded = {};
          }

          Object.assign(newResolvedState, this.getSortedData(newResolvedState));
        }

        // Set page to 0 if filters change
        if (oldState.filtered !== newResolvedState.filtered) {
          newResolvedState.page = 0;
        }

        // Calculate pageSize all the time
        if (newResolvedState.sortedData) {
          newResolvedState.pages = newResolvedState.manual ? newResolvedState.pages : Math.ceil(newResolvedState.sortedData.length / newResolvedState.pageSize);
          newResolvedState.page = newResolvedState.manual ? newResolvedState.page : Math.max(newResolvedState.page >= newResolvedState.pages ? newResolvedState.pages - 1 : newResolvedState.page, 0);
        }

        return newResolvedState;
      }
    }, {
      key: 'setStateWithData',
      value: function setStateWithData(dataModel, cb) {
        var _this2 = this;

        var oldState = this.getResolvedState();
        var newResolvedState = this.calculateNewResolvedState(dataModel);

        return this.setState(newResolvedState, function () {
          if (cb) {
            cb();
          }
          if (oldState.page !== newResolvedState.page || oldState.pageSize !== newResolvedState.pageSize || oldState.sorted !== newResolvedState.sorted || oldState.filtered !== newResolvedState.filtered) {
            _this2.fireFetchData();
          }
        });
      }
    }]);

    return _class;
  }(Base);
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9saWZlY3ljbGUuanMiXSwibmFtZXMiOlsicHJvcHMiLCJkZWZhdWx0U3RhdGUiLCJwYWdlIiwiZGVmYXVsdFBhZ2UiLCJwYWdlU2l6ZSIsImRlZmF1bHRQYWdlU2l6ZSIsInNvcnRlZCIsImRlZmF1bHRTb3J0ZWQiLCJleHBhbmRlZCIsImRlZmF1bHRFeHBhbmRlZCIsImZpbHRlcmVkIiwiZGVmYXVsdEZpbHRlcmVkIiwicmVzaXplZCIsImRlZmF1bHRSZXNpemVkIiwiY3VycmVudGx5UmVzaXppbmciLCJza2lwTmV4dFNvcnQiLCJyZXNvbHZlZFN0YXRlIiwiZ2V0UmVzb2x2ZWRTdGF0ZSIsImRhdGFNb2RlbCIsImdldERhdGFNb2RlbCIsInN0YXRlIiwiY2FsY3VsYXRlTmV3UmVzb2x2ZWRTdGF0ZSIsImZpcmVGZXRjaERhdGEiLCJwcmV2UHJvcHMiLCJwcmV2U3RhdGUiLCJvbGRTdGF0ZSIsIm5ld1N0YXRlIiwiZGVmYXVsdGFibGVPcHRpb25zIiwiZm9yRWFjaCIsImRlZmF1bHROYW1lIiwieCIsImNoYXJBdCIsInRvVXBwZXJDYXNlIiwic2xpY2UiLCJKU09OIiwic3RyaW5naWZ5IiwicmVzZXR0YWJsZU9wdGlvbnMiLCJiYXNlTmFtZSIsInJlcGxhY2UiLCJvcHRpb25OYW1lIiwiZGF0YSIsImNvbHVtbnMiLCJwaXZvdEJ5Iiwic2V0U3RhdGVXaXRoRGF0YSIsIm5ld1Jlc29sdmVkU3RhdGUiLCJmcmVlemVXaGVuRXhwYW5kZWQiLCJmcm96ZW4iLCJrZXlzIiwiT2JqZWN0IiwiaSIsImxlbmd0aCIsInNob3dGaWx0ZXJzIiwicmVzb2x2ZWREYXRhIiwiY29sbGFwc2VPblNvcnRpbmdDaGFuZ2UiLCJzb3J0ZWREYXRhIiwiY29sbGFwc2VPbkRhdGFDaGFuZ2UiLCJhc3NpZ24iLCJnZXRTb3J0ZWREYXRhIiwicGFnZXMiLCJtYW51YWwiLCJNYXRoIiwiY2VpbCIsIm1heCIsImNiIiwic2V0U3RhdGUiLCJCYXNlIl0sIm1hcHBpbmdzIjoi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QyxRQUFMLENBQWNwQixnQkFBZCxFQUFnQyxZQUFNO0FBQzNDLGNBQUltQixFQUFKLEVBQVE7QUFDTkE7QUFDRDtBQUNELGNBQ0V0QyxTQUFTdkIsSUFBVCxLQUFrQjBDLGlCQUFpQjFDLElBQW5DLElBQ0F1QixTQUFTckIsUUFBVCxLQUFzQndDLGlCQUFpQnhDLFFBRHZDLElBRUFxQixTQUFTbkIsTUFBVCxLQUFvQnNDLGlCQUFpQnRDLE1BRnJDLElBR0FtQixTQUFTZixRQUFULEtBQXNCa0MsaUJBQWlCbEMsUUFKekMsRUFLRTtBQUNBLG1CQUFLWSxhQUFMO0FBQ0Q7QUFDRixTQVpNLENBQVA7QUFhRDtBQXBKVTs7QUFBQTtBQUFBLElBQ0MyQyxJQUREO0FBQUEsQyIsImZpbGUiOiJsaWZlY3ljbGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgZGVmYXVsdCBCYXNlID0+XG4gIGNsYXNzIGV4dGVuZHMgQmFzZSB7XG4gICAgY29uc3RydWN0b3IgKHByb3BzKSB7XG4gICAgICBzdXBlcihwcm9wcylcblxuICAgICAgY29uc3QgZGVmYXVsdFN0YXRlID0ge1xuICAgICAgICBwYWdlOiBwcm9wcy5kZWZhdWx0UGFnZSxcbiAgICAgICAgcGFnZVNpemU6IHByb3BzLmRlZmF1bHRQYWdlU2l6ZSxcbiAgICAgICAgc29ydGVkOiBwcm9wcy5kZWZhdWx0U29ydGVkLFxuICAgICAgICBleHBhbmRlZDogcHJvcHMuZGVmYXVsdEV4cGFuZGVkLFxuICAgICAgICBmaWx0ZXJlZDogcHJvcHMuZGVmYXVsdEZpbHRlcmVkLFxuICAgICAgICByZXNpemVkOiBwcm9wcy5kZWZhdWx0UmVzaXplZCxcbiAgICAgICAgY3VycmVudGx5UmVzaXppbmc6IGZhbHNlLFxuICAgICAgICBza2lwTmV4dFNvcnQ6IGZhbHNlLFxuICAgICAgfVxuICAgICAgY29uc3QgcmVzb2x2ZWRTdGF0ZSA9IHRoaXMuZ2V0UmVzb2x2ZWRTdGF0ZShwcm9wcywgZGVmYXVsdFN0YXRlKVxuICAgICAgY29uc3QgZGF0YU1vZGVsID0gdGhpcy5nZXREYXRhTW9kZWwocmVzb2x2ZWRTdGF0ZSwgdHJ1ZSlcblxuICAgICAgdGhpcy5zdGF0ZSA9IHRoaXMuY2FsY3VsYXRlTmV3UmVzb2x2ZWRTdGF0ZShkYXRhTW9kZWwpXG4gICAgfVxuXG4gICAgVU5TQUZFX2NvbXBvbmVudERpZE1vdW50ICgpIHtcbiAgICAgIHRoaXMuZmlyZUZldGNoRGF0YSgpXG4gICAgfVxuXG4gICAgVU5TQUZFX2NvbXBvbmVudERpZFVwZGF0ZSAocHJldlByb3BzLCBwcmV2U3RhdGUpIHtcbiAgICAgIGNvbnN0IG9sZFN0YXRlID0gdGhpcy5nZXRSZXNvbHZlZFN0YXRlKHByZXZQcm9wcywgcHJldlN0YXRlKVxuICAgICAgY29uc3QgbmV3U3RhdGUgPSB0aGlzLmdldFJlc29sdmVkU3RhdGUodGhpcy5wcm9wcywgdGhpcy5zdGF0ZSlcblxuICAgICAgLy8gRG8gYSBkZWVwIGNvbXBhcmUgb2YgbmV3IGFuZCBvbGQgYGRlZmF1bHRPcHRpb25gIGFuZFxuICAgICAgLy8gaWYgdGhleSBhcmUgZGlmZmVyZW50IHJlc2V0IGBvcHRpb24gPSBkZWZhdWx0T3B0aW9uYFxuICAgICAgY29uc3QgZGVmYXVsdGFibGVPcHRpb25zID0gWydzb3J0ZWQnLCAnZmlsdGVyZWQnLCAncmVzaXplZCcsICdleHBhbmRlZCddXG4gICAgICBkZWZhdWx0YWJsZU9wdGlvbnMuZm9yRWFjaCh4ID0+IHtcbiAgICAgICAgY29uc3QgZGVmYXVsdE5hbWUgPSBgZGVmYXVsdCR7eC5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHguc2xpY2UoMSl9YFxuICAgICAgICBpZiAoSlNPTi5zdHJpbmdpZnkob2xkU3RhdGVbZGVmYXVsdE5hbWVdKSAhPT0gSlNPTi5zdHJpbmdpZnkobmV3U3RhdGVbZGVmYXVsdE5hbWVdKSkge1xuICAgICAgICAgIG5ld1N0YXRlW3hdID0gbmV3U3RhdGVbZGVmYXVsdE5hbWVdXG4gICAgICAgIH1cbiAgICAgIH0pXG5cbiAgICAgIC8vIElmIHRoZXkgY2hhbmdlIHRoZXNlIHRhYmxlIG9wdGlvbnMsIHdlIG5lZWQgdG8gcmVzZXQgZGVmYXVsdHNcbiAgICAgIC8vIG9yIGVsc2Ugd2UgY291bGQgZ2V0IGludG8gYSBzdGF0ZSB3aGVyZSB0aGUgdXNlciBoYXMgY2hhbmdlZCB0aGUgVUlcbiAgICAgIC8vIGFuZCB0aGVuIGRpc2FibGVkIHRoZSBhYmlsaXR5IHRvIGNoYW5nZSBpdCBiYWNrLlxuICAgICAgLy8gZS5nLiBJZiBgZmlsdGVyYWJsZWAgaGFzIGNoYW5nZWQsIHNldCBgZmlsdGVyZWQgPSBkZWZhdWx0RmlsdGVyZWRgXG4gICAgICBjb25zdCByZXNldHRhYmxlT3B0aW9ucyA9IFsnc29ydGFibGUnLCAnZmlsdGVyYWJsZScsICdyZXNpemFibGUnXVxuICAgICAgcmVzZXR0YWJsZU9wdGlvbnMuZm9yRWFjaCh4ID0+IHtcbiAgICAgICAgaWYgKG9sZFN0YXRlW3hdICE9PSBuZXdTdGF0ZVt4XSkge1xuICAgICAgICAgIGNvbnN0IGJhc2VOYW1lID0geC5yZXBsYWNlKCdhYmxlJywgJycpXG4gICAgICAgICAgY29uc3Qgb3B0aW9uTmFtZSA9IGAke2Jhc2VOYW1lfWVkYFxuICAgICAgICAgIGNvbnN0IGRlZmF1bHROYW1lID0gYGRlZmF1bHQke29wdGlvbk5hbWUuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBvcHRpb25OYW1lLnNsaWNlKDEpfWBcbiAgICAgICAgICBuZXdTdGF0ZVtvcHRpb25OYW1lXSA9IG5ld1N0YXRlW2RlZmF1bHROYW1lXVxuICAgICAgICB9XG4gICAgICB9KVxuXG4gICAgICAvLyBQcm9wcyB0aGF0IHRyaWdnZXIgYSBkYXRhIHVwZGF0ZVxuICAgICAgaWYgKFxuICAgICAgICBvbGRTdGF0ZS5kYXRhICE9PSBuZXdTdGF0ZS5kYXRhIHx8XG4gICAgICAgIG9sZFN0YXRlLmNvbHVtbnMgIT09IG5ld1N0YXRlLmNvbHVtbnMgfHxcbiAgICAgICAgb2xkU3RhdGUucGl2b3RCeSAhPT0gbmV3U3RhdGUucGl2b3RCeSB8fFxuICAgICAgICBvbGRTdGF0ZS5zb3J0ZWQgIT09IG5ld1N0YXRlLnNvcnRlZCB8fFxuICAgICAgICBvbGRTdGF0ZS5maWx0ZXJlZCAhPT0gbmV3U3RhdGUuZmlsdGVyZWRcbiAgICAgICkge1xuICAgICAgICB0aGlzLnNldFN0YXRlV2l0aERhdGEodGhpcy5nZXREYXRhTW9kZWwobmV3U3RhdGUsIG9sZFN0YXRlLmRhdGEgIT09IG5ld1N0YXRlLmRhdGEpKVxuICAgICAgfVxuICAgIH1cblxuICAgIGNhbGN1bGF0ZU5ld1Jlc29sdmVkU3RhdGUgKGRhdGFNb2RlbCkge1xuICAgICAgY29uc3Qgb2xkU3RhdGUgPSB0aGlzLmdldFJlc29sdmVkU3RhdGUoKVxuICAgICAgY29uc3QgbmV3UmVzb2x2ZWRTdGF0ZSA9IHRoaXMuZ2V0UmVzb2x2ZWRTdGF0ZSh7fSwgZGF0YU1vZGVsKVxuICAgICAgY29uc3QgeyBmcmVlemVXaGVuRXhwYW5kZWQgfSA9IG5ld1Jlc29sdmVkU3RhdGVcblxuICAgICAgLy8gRGVmYXVsdCB0byB1bmZyb3plbiBzdGF0ZVxuICAgICAgbmV3UmVzb2x2ZWRTdGF0ZS5mcm96ZW4gPSBmYWxzZVxuXG4gICAgICAvLyBJZiBmcmVlemVXaGVuRXhwYW5kZWQgaXMgc2V0LCBjaGVjayBmb3IgZnJvemVuIGNvbmRpdGlvbnNcbiAgICAgIGlmIChmcmVlemVXaGVuRXhwYW5kZWQpIHtcbiAgICAgICAgLy8gaWYgYW55IHJvd3MgYXJlIGV4cGFuZGVkLCBmcmVlemUgdGhlIGV4aXN0aW5nIGRhdGEgYW5kIHNvcnRpbmdcbiAgICAgICAgY29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKG5ld1Jlc29sdmVkU3RhdGUuZXhwYW5kZWQpXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICAgIGlmIChuZXdSZXNvbHZlZFN0YXRlLmV4cGFuZGVkW2tleXNbaV1dKSB7XG4gICAgICAgICAgICBuZXdSZXNvbHZlZFN0YXRlLmZyb3plbiA9IHRydWVcbiAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIElmIHRoZSBkYXRhIGlzbid0IGZyb3plbiBhbmQgZWl0aGVyIHRoZSBkYXRhIG9yXG4gICAgICAvLyBzb3J0aW5nIG1vZGVsIGhhcyBjaGFuZ2VkLCB1cGRhdGUgdGhlIGRhdGFcbiAgICAgIGlmIChcbiAgICAgICAgKG9sZFN0YXRlLmZyb3plbiAmJiAhbmV3UmVzb2x2ZWRTdGF0ZS5mcm96ZW4pIHx8XG4gICAgICAgIG9sZFN0YXRlLnNvcnRlZCAhPT0gbmV3UmVzb2x2ZWRTdGF0ZS5zb3J0ZWQgfHxcbiAgICAgICAgb2xkU3RhdGUuZmlsdGVyZWQgIT09IG5ld1Jlc29sdmVkU3RhdGUuZmlsdGVyZWQgfHxcbiAgICAgICAgb2xkU3RhdGUuc2hvd0ZpbHRlcnMgIT09IG5ld1Jlc29sdmVkU3RhdGUuc2hvd0ZpbHRlcnMgfHxcbiAgICAgICAgKCFuZXdSZXNvbHZlZFN0YXRlLmZyb3plbiAmJiBvbGRTdGF0ZS5yZXNvbHZlZERhdGEgIT09IG5ld1Jlc29sdmVkU3RhdGUucmVzb2x2ZWREYXRhKVxuICAgICAgKSB7XG4gICAgICAgIC8vIEhhbmRsZSBjb2xsYXBzZU9uc29ydGVkQ2hhbmdlICYgY29sbGFwc2VPbkRhdGFDaGFuZ2VcbiAgICAgICAgaWYgKFxuICAgICAgICAgIChvbGRTdGF0ZS5zb3J0ZWQgIT09IG5ld1Jlc29sdmVkU3RhdGUuc29ydGVkICYmIHRoaXMucHJvcHMuY29sbGFwc2VPblNvcnRpbmdDaGFuZ2UpIHx8XG4gICAgICAgICAgb2xkU3RhdGUuZmlsdGVyZWQgIT09IG5ld1Jlc29sdmVkU3RhdGUuZmlsdGVyZWQgfHxcbiAgICAgICAgICBvbGRTdGF0ZS5zaG93RmlsdGVycyAhPT0gbmV3UmVzb2x2ZWRTdGF0ZS5zaG93RmlsdGVycyB8fFxuICAgICAgICAgIChvbGRTdGF0ZS5zb3J0ZWREYXRhICYmXG4gICAgICAgICAgICAhbmV3UmVzb2x2ZWRTdGF0ZS5mcm96ZW4gJiZcbiAgICAgICAgICAgIG9sZFN0YXRlLnJlc29sdmVkRGF0YSAhPT0gbmV3UmVzb2x2ZWRTdGF0ZS5yZXNvbHZlZERhdGEgJiZcbiAgICAgICAgICAgIHRoaXMucHJvcHMuY29sbGFwc2VPbkRhdGFDaGFuZ2UpXG4gICAgICAgICkge1xuICAgICAgICAgIG5ld1Jlc29sdmVkU3RhdGUuZXhwYW5kZWQgPSB7fVxuICAgICAgICB9XG5cbiAgICAgICAgT2JqZWN0LmFzc2lnbihuZXdSZXNvbHZlZFN0YXRlLCB0aGlzLmdldFNvcnRlZERhdGEobmV3UmVzb2x2ZWRTdGF0ZSkpXG4gICAgICB9XG5cbiAgICAgIC8vIFNldCBwYWdlIHRvIDAgaWYgZmlsdGVycyBjaGFuZ2VcbiAgICAgIGlmIChvbGRTdGF0ZS5maWx0ZXJlZCAhPT0gbmV3UmVzb2x2ZWRTdGF0ZS5maWx0ZXJlZCkge1xuICAgICAgICBuZXdSZXNvbHZlZFN0YXRlLnBhZ2UgPSAwXG4gICAgICB9XG5cbiAgICAgIC8vIENhbGN1bGF0ZSBwYWdlU2l6ZSBhbGwgdGhlIHRpbWVcbiAgICAgIGlmIChuZXdSZXNvbHZlZFN0YXRlLnNvcnRlZERhdGEpIHtcbiAgICAgICAgbmV3UmVzb2x2ZWRTdGF0ZS5wYWdlcyA9IG5ld1Jlc29sdmVkU3RhdGUubWFudWFsXG4gICAgICAgICAgPyBuZXdSZXNvbHZlZFN0YXRlLnBhZ2VzXG4gICAgICAgICAgOiBNYXRoLmNlaWwobmV3UmVzb2x2ZWRTdGF0ZS5zb3J0ZWREYXRhLmxlbmd0aCAvIG5ld1Jlc29sdmVkU3RhdGUucGFnZVNpemUpXG4gICAgICAgIG5ld1Jlc29sdmVkU3RhdGUucGFnZSA9IG5ld1Jlc29sdmVkU3RhdGUubWFudWFsID8gbmV3UmVzb2x2ZWRTdGF0ZS5wYWdlIDogTWF0aC5tYXgoXG4gICAgICAgICAgbmV3UmVzb2x2ZWRTdGF0ZS5wYWdlID49IG5ld1Jlc29sdmVkU3RhdGUucGFnZXNcbiAgICAgICAgICAgID8gbmV3UmVzb2x2ZWRTdGF0ZS5wYWdlcyAtIDFcbiAgICAgICAgICAgIDogbmV3UmVzb2x2ZWRTdGF0ZS5wYWdlLFxuICAgICAgICAgIDBcbiAgICAgICAgKVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gbmV3UmVzb2x2ZWRTdGF0ZVxuICAgIH1cblxuICAgIHNldFN0YXRlV2l0aERhdGEgKGRhdGFNb2RlbCwgY2IpIHtcbiAgICAgIGNvbnN0IG9sZFN0YXRlID0gdGhpcy5nZXRSZXNvbHZlZFN0YXRlKClcbiAgICAgIGNvbnN0IG5ld1Jlc29sdmVkU3RhdGUgPSB0aGlzLmNhbGN1bGF0ZU5ld1Jlc29sdmVkU3RhdGUoZGF0YU1vZGVsKVxuXG4gICAgICByZXR1cm4gdGhpcy5zZXRTdGF0ZShuZXdSZXNvbHZlZFN0YXRlLCAoKSA9PiB7XG4gICAgICAgIGlmIChjYikge1xuICAgICAgICAgIGNiKClcbiAgICAgICAgfVxuICAgICAgICBpZiAoXG4gICAgICAgICAgb2xkU3RhdGUucGFnZSAhPT0gbmV3UmVzb2x2ZWRTdGF0ZS5wYWdlIHx8XG4gICAgICAgICAgb2xkU3RhdGUucGFnZVNpemUgIT09IG5ld1Jlc29sdmVkU3RhdGUucGFnZVNpemUgfHxcbiAgICAgICAgICBvbGRTdGF0ZS5zb3J0ZWQgIT09IG5ld1Jlc29sdmVkU3RhdGUuc29ydGVkIHx8XG4gICAgICAgICAgb2xkU3RhdGUuZmlsdGVyZWQgIT09IG5ld1Jlc29sdmVkU3RhdGUuZmlsdGVyZWRcbiAgICAgICAgKSB7XG4gICAgICAgICAgdGhpcy5maXJlRmV0Y2hEYXRhKClcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9XG4gIH1cbiJdfQ==