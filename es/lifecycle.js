var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

export default (function (Base) {
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
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9saWZlY3ljbGUuanMiXSwibmFtZXMiOlsicHJvcHMiLCJkZWZhdWx0U3RhdGUiLCJwYWdlIiwiZGVmYXVsdFBhZ2UiLCJwYWdlU2l6ZSIsImRlZmF1bHRQYWdlU2l6ZSIsInNvcnRlZCIsImRlZmF1bHRTb3J0ZWQiLCJleHBhbmRlZCIsImRlZmF1bHRFeHBhbmRlZCIsImZpbHRlcmVkIiwiZGVmYXVsdEZpbHRlcmVkIiwicmVzaXplZCIsImRlZmF1bHRSZXNpemVkIiwiY3VycmVudGx5UmVzaXppbmciLCJza2lwTmV4dFNvcnQiLCJyZXNvbHZlZFN0YXRlIiwiZ2V0UmVzb2x2ZWRTdGF0ZSIsImRhdGFNb2RlbCIsImdldERhdGFNb2RlbCIsInN0YXRlIiwiY2FsY3VsYXRlTmV3UmVzb2x2ZWRTdGF0ZSIsImZpcmVGZXRjaERhdGEiLCJwcmV2UHJvcHMiLCJwcmV2U3RhdGUiLCJvbGRTdGF0ZSIsIm5ld1N0YXRlIiwiZGVmYXVsdGFibGVPcHRpb25zIiwiZm9yRWFjaCIsImRlZmF1bHROYW1lIiwieCIsImNoYXJBdCIsInRvVXBwZXJDYXNlIiwic2xpY2UiLCJKU09OIiwic3RyaW5naWZ5IiwicmVzZXR0YWJsZU9wdGlvbnMiLCJiYXNlTmFtZSIsInJlcGxhY2UiLCJvcHRpb25OYW1lIiwiZGF0YSIsImNvbHVtbnMiLCJwaXZvdEJ5Iiwic2V0U3RhdGVXaXRoRGF0YSIsIm5ld1Jlc29sdmVkU3RhdGUiLCJmcmVlemVXaGVuRXhwYW5kZWQiLCJmcm96ZW4iLCJrZXlzIiwiT2JqZWN0IiwiaSIsImxlbmd0aCIsInNob3dGaWx0ZXJzIiwicmVzb2x2ZWREYXRhIiwiY29sbGFwc2VPblNvcnRpbmdDaGFuZ2UiLCJzb3J0ZWREYXRhIiwiY29sbGFwc2VPbkRhdGFDaGFuZ2UiLCJhc3NpZ24iLCJnZXRTb3J0ZWREYXRhIiwicGFnZXMiLCJtYW51YWwiLCJNYXRoIiwiY2VpbCIsIm1heCIsImNiIiwic2V0U3RhdGUiLCJCYXNlIl0sIm1hcHBpbmdzIjoi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LFFBQUwsQ0FBY3BCLGdCQUFkLEVBQWdDLFlBQU07QUFDM0MsY0FBSW1CLEVBQUosRUFBUTtBQUNOQTtBQUNEO0FBQ0QsY0FDRXRDLFNBQVN2QixJQUFULEtBQWtCMEMsaUJBQWlCMUMsSUFBbkMsSUFDQXVCLFNBQVNyQixRQUFULEtBQXNCd0MsaUJBQWlCeEMsUUFEdkMsSUFFQXFCLFNBQVNuQixNQUFULEtBQW9Cc0MsaUJBQWlCdEMsTUFGckMsSUFHQW1CLFNBQVNmLFFBQVQsS0FBc0JrQyxpQkFBaUJsQyxRQUp6QyxFQUtFO0FBQ0EsbUJBQUtZLGFBQUw7QUFDRDtBQUNGLFNBWk0sQ0FBUDtBQWFEO0FBcEpVOztBQUFBO0FBQUEsSUFDQzJDLElBREQ7QUFBQSxDQUFmIiwiZmlsZSI6ImxpZmVjeWNsZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBkZWZhdWx0IEJhc2UgPT5cbiAgY2xhc3MgZXh0ZW5kcyBCYXNlIHtcbiAgICBjb25zdHJ1Y3RvciAocHJvcHMpIHtcbiAgICAgIHN1cGVyKHByb3BzKVxuXG4gICAgICBjb25zdCBkZWZhdWx0U3RhdGUgPSB7XG4gICAgICAgIHBhZ2U6IHByb3BzLmRlZmF1bHRQYWdlLFxuICAgICAgICBwYWdlU2l6ZTogcHJvcHMuZGVmYXVsdFBhZ2VTaXplLFxuICAgICAgICBzb3J0ZWQ6IHByb3BzLmRlZmF1bHRTb3J0ZWQsXG4gICAgICAgIGV4cGFuZGVkOiBwcm9wcy5kZWZhdWx0RXhwYW5kZWQsXG4gICAgICAgIGZpbHRlcmVkOiBwcm9wcy5kZWZhdWx0RmlsdGVyZWQsXG4gICAgICAgIHJlc2l6ZWQ6IHByb3BzLmRlZmF1bHRSZXNpemVkLFxuICAgICAgICBjdXJyZW50bHlSZXNpemluZzogZmFsc2UsXG4gICAgICAgIHNraXBOZXh0U29ydDogZmFsc2UsXG4gICAgICB9XG4gICAgICBjb25zdCByZXNvbHZlZFN0YXRlID0gdGhpcy5nZXRSZXNvbHZlZFN0YXRlKHByb3BzLCBkZWZhdWx0U3RhdGUpXG4gICAgICBjb25zdCBkYXRhTW9kZWwgPSB0aGlzLmdldERhdGFNb2RlbChyZXNvbHZlZFN0YXRlLCB0cnVlKVxuXG4gICAgICB0aGlzLnN0YXRlID0gdGhpcy5jYWxjdWxhdGVOZXdSZXNvbHZlZFN0YXRlKGRhdGFNb2RlbClcbiAgICB9XG5cbiAgICBVTlNBRkVfY29tcG9uZW50RGlkTW91bnQgKCkge1xuICAgICAgdGhpcy5maXJlRmV0Y2hEYXRhKClcbiAgICB9XG5cbiAgICBVTlNBRkVfY29tcG9uZW50RGlkVXBkYXRlIChwcmV2UHJvcHMsIHByZXZTdGF0ZSkge1xuICAgICAgY29uc3Qgb2xkU3RhdGUgPSB0aGlzLmdldFJlc29sdmVkU3RhdGUocHJldlByb3BzLCBwcmV2U3RhdGUpXG4gICAgICBjb25zdCBuZXdTdGF0ZSA9IHRoaXMuZ2V0UmVzb2x2ZWRTdGF0ZSh0aGlzLnByb3BzLCB0aGlzLnN0YXRlKVxuXG4gICAgICAvLyBEbyBhIGRlZXAgY29tcGFyZSBvZiBuZXcgYW5kIG9sZCBgZGVmYXVsdE9wdGlvbmAgYW5kXG4gICAgICAvLyBpZiB0aGV5IGFyZSBkaWZmZXJlbnQgcmVzZXQgYG9wdGlvbiA9IGRlZmF1bHRPcHRpb25gXG4gICAgICBjb25zdCBkZWZhdWx0YWJsZU9wdGlvbnMgPSBbJ3NvcnRlZCcsICdmaWx0ZXJlZCcsICdyZXNpemVkJywgJ2V4cGFuZGVkJ11cbiAgICAgIGRlZmF1bHRhYmxlT3B0aW9ucy5mb3JFYWNoKHggPT4ge1xuICAgICAgICBjb25zdCBkZWZhdWx0TmFtZSA9IGBkZWZhdWx0JHt4LmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgeC5zbGljZSgxKX1gXG4gICAgICAgIGlmIChKU09OLnN0cmluZ2lmeShvbGRTdGF0ZVtkZWZhdWx0TmFtZV0pICE9PSBKU09OLnN0cmluZ2lmeShuZXdTdGF0ZVtkZWZhdWx0TmFtZV0pKSB7XG4gICAgICAgICAgbmV3U3RhdGVbeF0gPSBuZXdTdGF0ZVtkZWZhdWx0TmFtZV1cbiAgICAgICAgfVxuICAgICAgfSlcblxuICAgICAgLy8gSWYgdGhleSBjaGFuZ2UgdGhlc2UgdGFibGUgb3B0aW9ucywgd2UgbmVlZCB0byByZXNldCBkZWZhdWx0c1xuICAgICAgLy8gb3IgZWxzZSB3ZSBjb3VsZCBnZXQgaW50byBhIHN0YXRlIHdoZXJlIHRoZSB1c2VyIGhhcyBjaGFuZ2VkIHRoZSBVSVxuICAgICAgLy8gYW5kIHRoZW4gZGlzYWJsZWQgdGhlIGFiaWxpdHkgdG8gY2hhbmdlIGl0IGJhY2suXG4gICAgICAvLyBlLmcuIElmIGBmaWx0ZXJhYmxlYCBoYXMgY2hhbmdlZCwgc2V0IGBmaWx0ZXJlZCA9IGRlZmF1bHRGaWx0ZXJlZGBcbiAgICAgIGNvbnN0IHJlc2V0dGFibGVPcHRpb25zID0gWydzb3J0YWJsZScsICdmaWx0ZXJhYmxlJywgJ3Jlc2l6YWJsZSddXG4gICAgICByZXNldHRhYmxlT3B0aW9ucy5mb3JFYWNoKHggPT4ge1xuICAgICAgICBpZiAob2xkU3RhdGVbeF0gIT09IG5ld1N0YXRlW3hdKSB7XG4gICAgICAgICAgY29uc3QgYmFzZU5hbWUgPSB4LnJlcGxhY2UoJ2FibGUnLCAnJylcbiAgICAgICAgICBjb25zdCBvcHRpb25OYW1lID0gYCR7YmFzZU5hbWV9ZWRgXG4gICAgICAgICAgY29uc3QgZGVmYXVsdE5hbWUgPSBgZGVmYXVsdCR7b3B0aW9uTmFtZS5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIG9wdGlvbk5hbWUuc2xpY2UoMSl9YFxuICAgICAgICAgIG5ld1N0YXRlW29wdGlvbk5hbWVdID0gbmV3U3RhdGVbZGVmYXVsdE5hbWVdXG4gICAgICAgIH1cbiAgICAgIH0pXG5cbiAgICAgIC8vIFByb3BzIHRoYXQgdHJpZ2dlciBhIGRhdGEgdXBkYXRlXG4gICAgICBpZiAoXG4gICAgICAgIG9sZFN0YXRlLmRhdGEgIT09IG5ld1N0YXRlLmRhdGEgfHxcbiAgICAgICAgb2xkU3RhdGUuY29sdW1ucyAhPT0gbmV3U3RhdGUuY29sdW1ucyB8fFxuICAgICAgICBvbGRTdGF0ZS5waXZvdEJ5ICE9PSBuZXdTdGF0ZS5waXZvdEJ5IHx8XG4gICAgICAgIG9sZFN0YXRlLnNvcnRlZCAhPT0gbmV3U3RhdGUuc29ydGVkIHx8XG4gICAgICAgIG9sZFN0YXRlLmZpbHRlcmVkICE9PSBuZXdTdGF0ZS5maWx0ZXJlZFxuICAgICAgKSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGVXaXRoRGF0YSh0aGlzLmdldERhdGFNb2RlbChuZXdTdGF0ZSwgb2xkU3RhdGUuZGF0YSAhPT0gbmV3U3RhdGUuZGF0YSkpXG4gICAgICB9XG4gICAgfVxuXG4gICAgY2FsY3VsYXRlTmV3UmVzb2x2ZWRTdGF0ZSAoZGF0YU1vZGVsKSB7XG4gICAgICBjb25zdCBvbGRTdGF0ZSA9IHRoaXMuZ2V0UmVzb2x2ZWRTdGF0ZSgpXG4gICAgICBjb25zdCBuZXdSZXNvbHZlZFN0YXRlID0gdGhpcy5nZXRSZXNvbHZlZFN0YXRlKHt9LCBkYXRhTW9kZWwpXG4gICAgICBjb25zdCB7IGZyZWV6ZVdoZW5FeHBhbmRlZCB9ID0gbmV3UmVzb2x2ZWRTdGF0ZVxuXG4gICAgICAvLyBEZWZhdWx0IHRvIHVuZnJvemVuIHN0YXRlXG4gICAgICBuZXdSZXNvbHZlZFN0YXRlLmZyb3plbiA9IGZhbHNlXG5cbiAgICAgIC8vIElmIGZyZWV6ZVdoZW5FeHBhbmRlZCBpcyBzZXQsIGNoZWNrIGZvciBmcm96ZW4gY29uZGl0aW9uc1xuICAgICAgaWYgKGZyZWV6ZVdoZW5FeHBhbmRlZCkge1xuICAgICAgICAvLyBpZiBhbnkgcm93cyBhcmUgZXhwYW5kZWQsIGZyZWV6ZSB0aGUgZXhpc3RpbmcgZGF0YSBhbmQgc29ydGluZ1xuICAgICAgICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXMobmV3UmVzb2x2ZWRTdGF0ZS5leHBhbmRlZClcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgICAgaWYgKG5ld1Jlc29sdmVkU3RhdGUuZXhwYW5kZWRba2V5c1tpXV0pIHtcbiAgICAgICAgICAgIG5ld1Jlc29sdmVkU3RhdGUuZnJvemVuID0gdHJ1ZVxuICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gSWYgdGhlIGRhdGEgaXNuJ3QgZnJvemVuIGFuZCBlaXRoZXIgdGhlIGRhdGEgb3JcbiAgICAgIC8vIHNvcnRpbmcgbW9kZWwgaGFzIGNoYW5nZWQsIHVwZGF0ZSB0aGUgZGF0YVxuICAgICAgaWYgKFxuICAgICAgICAob2xkU3RhdGUuZnJvemVuICYmICFuZXdSZXNvbHZlZFN0YXRlLmZyb3plbikgfHxcbiAgICAgICAgb2xkU3RhdGUuc29ydGVkICE9PSBuZXdSZXNvbHZlZFN0YXRlLnNvcnRlZCB8fFxuICAgICAgICBvbGRTdGF0ZS5maWx0ZXJlZCAhPT0gbmV3UmVzb2x2ZWRTdGF0ZS5maWx0ZXJlZCB8fFxuICAgICAgICBvbGRTdGF0ZS5zaG93RmlsdGVycyAhPT0gbmV3UmVzb2x2ZWRTdGF0ZS5zaG93RmlsdGVycyB8fFxuICAgICAgICAoIW5ld1Jlc29sdmVkU3RhdGUuZnJvemVuICYmIG9sZFN0YXRlLnJlc29sdmVkRGF0YSAhPT0gbmV3UmVzb2x2ZWRTdGF0ZS5yZXNvbHZlZERhdGEpXG4gICAgICApIHtcbiAgICAgICAgLy8gSGFuZGxlIGNvbGxhcHNlT25zb3J0ZWRDaGFuZ2UgJiBjb2xsYXBzZU9uRGF0YUNoYW5nZVxuICAgICAgICBpZiAoXG4gICAgICAgICAgKG9sZFN0YXRlLnNvcnRlZCAhPT0gbmV3UmVzb2x2ZWRTdGF0ZS5zb3J0ZWQgJiYgdGhpcy5wcm9wcy5jb2xsYXBzZU9uU29ydGluZ0NoYW5nZSkgfHxcbiAgICAgICAgICBvbGRTdGF0ZS5maWx0ZXJlZCAhPT0gbmV3UmVzb2x2ZWRTdGF0ZS5maWx0ZXJlZCB8fFxuICAgICAgICAgIG9sZFN0YXRlLnNob3dGaWx0ZXJzICE9PSBuZXdSZXNvbHZlZFN0YXRlLnNob3dGaWx0ZXJzIHx8XG4gICAgICAgICAgKG9sZFN0YXRlLnNvcnRlZERhdGEgJiZcbiAgICAgICAgICAgICFuZXdSZXNvbHZlZFN0YXRlLmZyb3plbiAmJlxuICAgICAgICAgICAgb2xkU3RhdGUucmVzb2x2ZWREYXRhICE9PSBuZXdSZXNvbHZlZFN0YXRlLnJlc29sdmVkRGF0YSAmJlxuICAgICAgICAgICAgdGhpcy5wcm9wcy5jb2xsYXBzZU9uRGF0YUNoYW5nZSlcbiAgICAgICAgKSB7XG4gICAgICAgICAgbmV3UmVzb2x2ZWRTdGF0ZS5leHBhbmRlZCA9IHt9XG4gICAgICAgIH1cblxuICAgICAgICBPYmplY3QuYXNzaWduKG5ld1Jlc29sdmVkU3RhdGUsIHRoaXMuZ2V0U29ydGVkRGF0YShuZXdSZXNvbHZlZFN0YXRlKSlcbiAgICAgIH1cblxuICAgICAgLy8gU2V0IHBhZ2UgdG8gMCBpZiBmaWx0ZXJzIGNoYW5nZVxuICAgICAgaWYgKG9sZFN0YXRlLmZpbHRlcmVkICE9PSBuZXdSZXNvbHZlZFN0YXRlLmZpbHRlcmVkKSB7XG4gICAgICAgIG5ld1Jlc29sdmVkU3RhdGUucGFnZSA9IDBcbiAgICAgIH1cblxuICAgICAgLy8gQ2FsY3VsYXRlIHBhZ2VTaXplIGFsbCB0aGUgdGltZVxuICAgICAgaWYgKG5ld1Jlc29sdmVkU3RhdGUuc29ydGVkRGF0YSkge1xuICAgICAgICBuZXdSZXNvbHZlZFN0YXRlLnBhZ2VzID0gbmV3UmVzb2x2ZWRTdGF0ZS5tYW51YWxcbiAgICAgICAgICA/IG5ld1Jlc29sdmVkU3RhdGUucGFnZXNcbiAgICAgICAgICA6IE1hdGguY2VpbChuZXdSZXNvbHZlZFN0YXRlLnNvcnRlZERhdGEubGVuZ3RoIC8gbmV3UmVzb2x2ZWRTdGF0ZS5wYWdlU2l6ZSlcbiAgICAgICAgbmV3UmVzb2x2ZWRTdGF0ZS5wYWdlID0gbmV3UmVzb2x2ZWRTdGF0ZS5tYW51YWwgPyBuZXdSZXNvbHZlZFN0YXRlLnBhZ2UgOiBNYXRoLm1heChcbiAgICAgICAgICBuZXdSZXNvbHZlZFN0YXRlLnBhZ2UgPj0gbmV3UmVzb2x2ZWRTdGF0ZS5wYWdlc1xuICAgICAgICAgICAgPyBuZXdSZXNvbHZlZFN0YXRlLnBhZ2VzIC0gMVxuICAgICAgICAgICAgOiBuZXdSZXNvbHZlZFN0YXRlLnBhZ2UsXG4gICAgICAgICAgMFxuICAgICAgICApXG4gICAgICB9XG5cbiAgICAgIHJldHVybiBuZXdSZXNvbHZlZFN0YXRlXG4gICAgfVxuXG4gICAgc2V0U3RhdGVXaXRoRGF0YSAoZGF0YU1vZGVsLCBjYikge1xuICAgICAgY29uc3Qgb2xkU3RhdGUgPSB0aGlzLmdldFJlc29sdmVkU3RhdGUoKVxuICAgICAgY29uc3QgbmV3UmVzb2x2ZWRTdGF0ZSA9IHRoaXMuY2FsY3VsYXRlTmV3UmVzb2x2ZWRTdGF0ZShkYXRhTW9kZWwpXG5cbiAgICAgIHJldHVybiB0aGlzLnNldFN0YXRlKG5ld1Jlc29sdmVkU3RhdGUsICgpID0+IHtcbiAgICAgICAgaWYgKGNiKSB7XG4gICAgICAgICAgY2IoKVxuICAgICAgICB9XG4gICAgICAgIGlmIChcbiAgICAgICAgICBvbGRTdGF0ZS5wYWdlICE9PSBuZXdSZXNvbHZlZFN0YXRlLnBhZ2UgfHxcbiAgICAgICAgICBvbGRTdGF0ZS5wYWdlU2l6ZSAhPT0gbmV3UmVzb2x2ZWRTdGF0ZS5wYWdlU2l6ZSB8fFxuICAgICAgICAgIG9sZFN0YXRlLnNvcnRlZCAhPT0gbmV3UmVzb2x2ZWRTdGF0ZS5zb3J0ZWQgfHxcbiAgICAgICAgICBvbGRTdGF0ZS5maWx0ZXJlZCAhPT0gbmV3UmVzb2x2ZWRTdGF0ZS5maWx0ZXJlZFxuICAgICAgICApIHtcbiAgICAgICAgICB0aGlzLmZpcmVGZXRjaERhdGEoKVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH1cbiAgfVxuIl19