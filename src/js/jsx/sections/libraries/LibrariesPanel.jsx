/*
 * Copyright (c) 2014 Adobe Systems Incorporated. All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 *
 */


define(function (require, exports, module) {
    "use strict";

    var React = require("react"),
        Fluxxor = require("fluxxor"),
        FluxMixin = Fluxxor.FluxMixin(React),
        StoreWatchMixin = Fluxxor.StoreWatchMixin,
        classnames = require("classnames"),
        Promise = require("bluebird"),
        Immutable = require("immutable");

    var TitleHeader = require("jsx!js/jsx/shared/TitleHeader"),
        LibraryList = require("jsx!./LibraryList"),
        LibraryBar = require("jsx!./LibraryBar"),
        Library = require("jsx!./Library"),
        Button = require("jsx!js/jsx/shared/Button"),
        SVGIcon = require("jsx!js/jsx/shared/SVGIcon"),
        Droppable = require("jsx!js/jsx/shared/Droppable"),
        SplitButton = require("jsx!js/jsx/shared/SplitButton"),
        SplitButtonList = SplitButton.SplitButtonList,
        SplitButtonItem = SplitButton.SplitButtonItem,
        strings = require("i18n!nls/strings");

    var LibrariesPanel = React.createClass({
        mixins: [FluxMixin, StoreWatchMixin("library", "draganddrop")],

        getInitialState: function () {
            return ({
                selectedLibrary: null
            });
        },

        getStateFromFlux: function () {
            var libraryStore = this.getFlux().store("library"),
                libraries = libraryStore.getLibraries(),
                dndState = this.getFlux().store("draganddrop").getState(),
                isDropTarget = dndState.dropTarget && dndState.dropTarget.key === DroppablePanel.DROPPABLE_KEY;
                
            return {
                libraries: libraries,
                isDropTarget: isDropTarget,
                isValidDropTarget: dndState.hasValidDropTarget
            };
        },

        /**
         * A throttled version of os.setTooltip
         *
         * @type {?function}
         */
        _setTooltipThrottled: null,

        shouldComponentUpdate: function (nextProps, nextState) {
            if (this.props.disabled !== nextProps.disabled) {
                return true;
            }

            if (!nextProps.visible && !this.props.visible) {
                return false;
            }
            
            if (this.state.isDropTarget && nextState.isDropTarget) {
                return false;
            }

            return true;
        },

        _handleRefresh: function () {
            this.getFlux().actions.libraries.beforeStartup();
            this.getFlux().actions.libraries.afterStartup();
        },

        _handleLibraryChange: function (libraryID) {
            this.setState({
                selectedLibrary: libraryID
            });

            this.getFlux().actions.libraries.selectLibrary(libraryID);
        },

        _handleLibraryAdd: function () {
            this.getFlux().actions.libraries.createLibrary("New Library");
        },

        _handleLibraryRemove: function () {
            this.getFlux().actions.libraries.removeCurrentLibrary();
        },
        
        /**
         * Return library panel content based on the connection status of CC Library.
         * @private
         * 
         * @return {ReactComponent}
         */
        _renderLibrariesContent: function () {
            var libraryStore = this.getFlux().store("library"),
                connected = libraryStore.getConnectionStatus(),
                containerContents;

            if (connected) {
                if (this.props.visible && !this.props.disabled) {
                    var libraries = this.state.libraries,
                        currentLibrary = libraries.get(this.state.selectedLibrary);
                    
                    containerContents = (
                        <div className="libraries__content">
                            <div className="formline">
                                <LibraryList
                                    document={this.props.document}
                                    libraries={libraries}
                                    selected={currentLibrary}
                                    onLibraryChange={this._handleLibraryChange} />
                                <SplitButtonList className="libraries__split-button-list">
                                    <SplitButtonItem
                                        title={"CREATE LIBRARY"}
                                        className="button-plus"
                                        iconId="plus"
                                        onClick={this._handleLibraryAdd} />
                                    <SplitButtonItem
                                        title={"DELETE LIBRARY"}
                                        className="button-plus"
                                        iconId="libraries-delete"
                                        onClick={this._handleLibraryRemove} />
                                </SplitButtonList>
                            </div>
                            <Library
                                addElement={this._handleAddElement}
                                library={currentLibrary} />
                            <LibraryBar
                                document={this.props.document}
                                disabled={!currentLibrary}/>
                        </div>
                    );
                }
            } else {
                containerContents = (
                    <div className="libraries__content">
                        Can't connect to local library process!
                        <Button title="Refresh" className="button-plus" onClick={this._handleRefresh}>
                            <SVGIcon viewbox="0 0 12 12" CSSID="plus" />
                        </Button>
                    </div>
                );
            }

            return containerContents;
        },

        render: function () {
            var containerClasses = classnames({
                "section-container": true,
                "section-container__collapsed": !this.props.visible
            });

            var sectionClasses = classnames({
                "libraries": true,
                "section": true,
                "section__collapsed": !this.props.visible,
                "libraries_no-drop": this.state.isDropTarget && !this.state.selectedLibrary
            });
            
            var librariesContent = this._renderLibrariesContent(),
                dropOverlay;
            
            if (this.state.isDropTarget) {
                var classes = classnames({
                    "libraries__drop-overlay": true,
                    "libraries__drop-overlay_disallow": !this.state.isValidDropTarget
                });
                
                dropOverlay = (<div className={classes}/>);
            }

            return (
                <section
                    className={sectionClasses}
                    onMouseEnter={this.props.onMouseEnterDroppable}
                    onMouseLeave={this.props.onMouseLeaveDroppable}>
                    {dropOverlay}
                    <TitleHeader
                        title={strings.TITLE_LIBRARIES}
                        visible={this.props.visible}
                        disabled={this.props.disabled}
                        onDoubleClick={this.props.onVisibilityToggle} />
                    <div className={containerClasses}>
                        {librariesContent}
                    </div>
                </section>
            );
        }
    });
    
    /**
     * Droppabl callback. Decide whether the draged layers can be droped into the libraries. 
     * @return {{valid: boolean, compatible: boolean}} 
     */
    var canDropLayers = function (dropInfo, dragTargets) {
        var droppablePanel = dropInfo.droppable,
            flux = require("js/main").getController().flux,
            currentLibrary = flux.store("library").getCurrentLibrary(),
            // Single linked layer is not accepted, but multiple linked (or mixed) layers are accepted.
            isSingleLinkedLayer = dragTargets.size === 1 && dragTargets.first().isLinked;
            
        return {
            valid: droppablePanel.state.isMouseOver && currentLibrary && !isSingleLinkedLayer,
            compatible: droppablePanel.state.isMouseOver
        };
    };
    
    /**
     * Droppable callback. Handle dropped layers.
     * @return {Promise} 
     */
    var handleDropLayers = function (dropInfo, droppedLayers) {
        var flux = require("js/main").getController().flux,
            document = flux.store("application").getCurrentDocument(),
            selectedLayers = document.layers.selected,
            promise = Promise.resolve();
            
        if (!Immutable.is(selectedLayers, droppedLayers)) {
            promise = flux.actions.layers.select(document, droppedLayers, "select");
        }
        
        return promise.then(function () {
            flux.actions.libraries.createElementFromSelectedLayer();
        });
    };
    
    /**
     * Droppable callback. Return required settings that will allow DroppablePanel to work.
     */
    var droppableSettings = function (props) {
        return {
            zone: props.document.id,
            key: DroppablePanel.DROPPABLE_KEY,
            keyObject: { key: DroppablePanel.DROPPABLE_KEY },
            isValid: canDropLayers,
            handleDrop: handleDropLayers
        };
    };
    
    var DroppablePanel = Droppable.createWithComponent(LibrariesPanel, droppableSettings);
    DroppablePanel.DROPPABLE_KEY = "LibrariesPanel";
    
    module.exports = DroppablePanel;
});
