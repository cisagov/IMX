import { Component, OnInit, Input, ViewEncapsulation, OnDestroy, Output, EventEmitter } from '@angular/core';
import { StixService } from '../stix-service.service';
import stix2viz from './stix2viz/stix2viz/stix2viz';
import { faAngleDoubleUp } from '@fortawesome/free-solid-svg-icons';
@Component({
    selector: 'app-stix-viewer',
    templateUrl: './stix-viewer.component.html',
    styleUrls: ['./stix-viewer.component.css'],
    encapsulation: ViewEncapsulation.None,
    standalone: false,
})
export class StixViewerComponent implements OnInit, OnDestroy {
    @Input() bundle: any;
    @Input() preview = false;
    @Input() fullScreenMode;
    @Output() screenChange = new EventEmitter<boolean>();

    faAngleDoubleUp = faAngleDoubleUp;

    view;
    canvas: HTMLElement;
    canvasContainer: HTMLElement;
    legend: HTMLElement;

    activeTab = 'selected-node';
    selectedNode = false;
    showMenuBar = true;
    wantsList = false;

    constructor(public stixService: StixService) {}

    ngOnInit(): void {
        this.canvas = document.getElementById('canvas');
        this.canvasContainer = document.getElementById('canvas-container');
        this.legend = document.getElementById('legend');

        if (this.preview) {
            this.vizStixWrapper(
                {
                    type: 'bundle',
                    spec_version: '2.1',
                    objects: this.stixService.objectsToLoad,
                },
                null
            );
        } else {
            this.vizStixWrapper(
                {
                    type: 'bundle',
                    id: 'bundle',
                    spec_version: '2.1',
                    objects: [...this.stixService.bundle.objects, ...this.stixService.customObjects],
                },
                null
            );
        }

        document.addEventListener('fullscreenchange', this.handleScreenChange.bind(this));
        document.addEventListener('mozfullscreenchange', this.handleScreenChange.bind(this));
        document.addEventListener('webkitfullscreenchange', this.handleScreenChange.bind(this));
        document.addEventListener('MSFullscreenChange', this.handleScreenChange.bind(this));
    }

    ngOnDestroy() {
        document.removeEventListener('fullscreenchange', this.handleScreenChange.bind(this));
        document.removeEventListener('mozfullscreenchange', this.handleScreenChange.bind(this));
        document.removeEventListener('webkitfullscreenchange', this.handleScreenChange.bind(this));
        document.removeEventListener('MSFullscreenChange', this.handleScreenChange.bind(this));

        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document['mozCancelFullScreen']) {
            document['mozCancelFullScreen']();
        } else if (document['webkitExitFullscreen']) {
            document['webkitExitFullscreen']();
        } else if (document['msExitFullscreen']) {
            document['msExitFullscreen']();
        }
    }

    handleScreenChange() {
        if (
            !document.fullscreenElement &&
            !document['mozFullScreenElement'] &&
            !document['webkitFullscreenElement'] &&
            !document['msFullscreenElement']
        ) {
            this.fullScreenMode = false;
            this.screenChange.emit(false);
        } else {
            this.fullScreenMode = true;
            this.screenChange.emit(true);
        }
    }

    openFullscreen() {
        const elem: any = document.documentElement;
        if (!this.fullScreenMode) {
            if (elem.requestFullscreen) {
                elem.requestFullscreen();
            } else if (elem.mozRequestFullScreen) {
                elem.mozRequestFullScreen();
            } else if (elem.webkitRequestFullscreen) {
                elem.webkitRequestFullscreen();
            } else if (elem.msRequestFullscreen) {
                elem.msRequestFullscreen();
            }

            window.scrollTo(0, 0);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document['mozCancelFullScreen']) {
                document['mozCancelFullScreen']();
            } else if (document['webkitExitFullscreen']) {
                document['webkitExitFullscreen']();
            } else if (document['msExitFullscreen']) {
                document['msExitFullscreen']();
            }
        }
    }

    /* ******************************************************
     * Initializes the view, then renders it.
     * ******************************************************/
    vizStixWrapper(content, customConfig, includeLegend = true) {
        if (customConfig)
            try {
                customConfig = JSON.parse(customConfig);
            } catch (err) {
                this.alertException(err, 'Invalid configuration: must be JSON');
                return;
            }
        else customConfig = {};

        // Hard-coded working icon directory setting for this application.
        customConfig.iconDir = './assets/icons';

        try {
            const modules = stix2viz.makeModule();
            let [nodeDataSet, edgeDataSet, stixIdToObject] = modules.makeGraphData(JSON.stringify(content), customConfig);
            
            this.wantsList = false;
            if (nodeDataSet.length > 200)
                this.wantsList = confirm('This graph contains ' + nodeDataSet.length.toString() + ' nodes.  Do you wish to display it as a list?');

            if (this.wantsList) {
                this.view = modules.makeListView(this.canvas, nodeDataSet, edgeDataSet, stixIdToObject, customConfig);
                this.view.on('click', (e) => this.listViewClickHandler(e, edgeDataSet, stixIdToObject));
            } else {
                this.view = modules.makeGraphView(this.canvas, nodeDataSet, edgeDataSet, stixIdToObject, customConfig);
                this.view.on('click', (e) => this.graphViewClickHandler(e, edgeDataSet, stixIdToObject));
            }

            if (includeLegend) {
                this.populateLegend(this.view.legendData[0], this.view.legendData[1]);
                this.legend.addEventListener(
                    'click',
                    (e) => {
                        this.legendClickHandler(e, this.view);
                    },
                    { capture: true }
                );
            }
        } catch (err) {
            console.error(err);
            this.alertException(err);
        }
    }

    /**
     * Handle clicks on the visjs graph view.
     * @param edgeDataSet A visjs DataSet instance with graph edge data derived
     *      from STIX content
     * @param stixIdToObject A Map instance mapping STIX IDs to STIX objects as
     *      Maps, containing STIX content.
     */
    graphViewClickHandler(event, edgeDataSet, stixIdToObject) {
        if (event.nodes.length > 0) {
            // A click on a node
            let stixObject = stixIdToObject.get(event.nodes[0]);
            if (stixObject) this.selectedNode = true;
            this.populateSelected(stixObject, edgeDataSet, stixIdToObject);
        } else if (event.edges.length > 0) {
            // A click on an edge
            let stixRel = stixIdToObject.get(event.edges[0]);
            if (stixRel) this.populateSelected(stixRel, edgeDataSet, stixIdToObject);
            else
                // Just make something up to show for embedded relationships
                this.populateSelected(new Map([['', '(Embedded relationship)']]), edgeDataSet, stixIdToObject);
        }
    }

    /* ******************************************************
     * Adds icons and information to the legend.
     * ******************************************************/
    populateLegend(iconURLMap, defaultIconURL) {
        let tbody, tr, td;
        let colIdx = 0;
        let table = document.getElementById('legend-content') as HTMLTableElement;

        // Reset table content if necessary.
        if (table.tBodies.length === 0) tbody = table.createTBody();
        else tbody = table.tBodies[0];

        tbody.replaceChildren();

        tr = tbody.insertRow();

        for (let [stixType, iconURL] of iconURLMap) {
            let img = document.createElement('img');

            img.onerror = function () {
                // set the node's icon to the default if this image could not
                // load
                this.src = defaultIconURL;
                // our default svg is enormous... shrink it down!
                this.width = '37';
                this.height = '37';
            };
            img.src = iconURL;

            if (colIdx > 5) {
                colIdx = 0;
                tr = tbody.insertRow();
            }

            td = tr.insertCell();
            ++colIdx;

            let div = document.createElement('div');
            div.className = 'legend-name';
            div.textContent = stixType.charAt(0).toUpperCase() + stixType.substr(1).toLowerCase();

            td.append(img);
            td.append(div);
        }
    }

    /**
     * Populate relevant webpage areas according to a particular STIX object.
     *
     * @param stixObject The STIX object to display information about
     * @param edgeDataSet A visjs DataSet instance with graph edge data derived
     *      from STIX content
     * @param stixIdToObject A Map instance mapping STIX IDs to STIX objects as
     *      Maps, containing STIX content.
     */
    populateSelected(stixObject, edgeDataSet, stixIdToObject) {
        // Remove old values from HTML
        let selectedContainer = document.getElementById('selection');
        selectedContainer.replaceChildren();

        let contentNodes = this.stixObjectContentToDOMNodes(stixObject, edgeDataSet, stixIdToObject, /*topLevel=*/ true);
        selectedContainer.append(...contentNodes);

        this.populateConnections(stixObject, edgeDataSet, stixIdToObject);
    }

    /**
     * Populate the Linked Nodes box with the connections of the given STIX
     * object.
     *
     * @param stixObject The STIX object to display connection information
     *      about
     * @param edgeDataSet A visjs DataSet instance with graph edge data derived
     *      from STIX content
     * @param stixIdToObject A Map instance mapping STIX IDs to STIX objects as
     *      Maps, containing STIX content.
     */
    populateConnections(stixObject, edgeDataSet, stixIdToObject) {
        let objId = stixObject.get('id');

        let edges = edgeDataSet.get({
            filter: (item) => item.from === objId || item.to === objId,
        });

        let eltConnIncoming = document.getElementById('connections-incoming');
        let eltConnOutgoing = document.getElementById('connections-outgoing');

        eltConnIncoming.replaceChildren();
        eltConnOutgoing.replaceChildren();

        let listIn = document.createElement('ol');
        let listOut = document.createElement('ol');

        eltConnIncoming.append(listIn);
        eltConnOutgoing.append(listOut);

        for (let edge of edges) {
            let targetList;
            let summaryNode = document.createElement('summary');
            let otherEndSpan = document.createElement('span');
            let otherEndObj;

            if (objId === edge.from) {
                otherEndObj = stixIdToObject.get(edge.to);
                otherEndSpan.append(otherEndObj.get('type'));

                summaryNode.append(edge.label + ' ');
                summaryNode.append(otherEndSpan);

                targetList = listOut;
            } else {
                otherEndObj = stixIdToObject.get(edge.from);
                otherEndSpan.append(otherEndObj.get('type'));

                summaryNode.append(otherEndSpan);
                summaryNode.append(' ' + edge.label);

                targetList = listIn;
            }

            otherEndSpan.className = 'selected-object-text-value-ref';
            otherEndSpan.addEventListener('click', (e) => {
                this.view.selectNode(otherEndObj.get('id'));
                this.populateSelected(otherEndObj, edgeDataSet, stixIdToObject);
            });

            let li = document.createElement('li');
            let detailsNode = document.createElement('details');

            targetList.append(li);
            li.append(detailsNode);
            detailsNode.append(summaryNode);

            let objRenderNodes = this.stixObjectContentToDOMNodes(otherEndObj, edgeDataSet, stixIdToObject, /*topLevel=*/ true);
            detailsNode.append(...objRenderNodes);
        }
    }

    /**
     * Handle clicks on the list view.
     *
     * @param edgeDataSet A visjs DataSet instance with graph edge data derived
     *      from STIX content
     * @param stixIdToObject A Map instance mapping STIX IDs to STIX objects as
     *      Maps, containing STIX content.
     */
    listViewClickHandler(event, edgeDataSet, stixIdToObject) {
        let clickedItem = event.target;

        if (clickedItem.tagName === 'LI') {
            let stixId = clickedItem.id;
            let stixObject = stixIdToObject.get(stixId);

            this.view.selectNode(stixId);

            if (stixObject) this.populateSelected(stixObject, edgeDataSet, stixIdToObject);
            else
                // Just make something up to show for embedded relationships
                this.populateSelected(new Map([['', '(Embedded relationship)']]), edgeDataSet, stixIdToObject);
        }
    }

    /**
     * Create a rendering of an object/dictionary as part of rendering an
     * overall STIX object.
     *
     * @param objectContent The object/dictionary to render, as a Map instance
     * @param edgeDataSet A visjs DataSet instance with graph edge data derived
     *      from STIX content
     * @param stixIdToObject A Map instance mapping STIX IDs to STIX objects as
     *      Maps, containing STIX content.
     * @param topLevel Whether objectContent is itself a whole STIX object,
     *      i.e. the top level of a content tree.  This is used to adjust the
     *      rendering, e.g. omit the surrounding braces at the top level.
     * @return The rendering as an array of DOM elements
     */
    stixObjectContentToDOMNodes(objectContent, edgeDataSet, stixIdToObject, topLevel = false) {
        let nodes = [];

        if (!topLevel) nodes.push(document.createTextNode('{'));

        let objectContentSorted = new Map();
        let objectsToStart = ['type', 'id', 'created', 'modified', 'name'];
        objectsToStart.forEach((o) => {
            if (objectContent.has(o)) {
                objectContentSorted.set(o, objectContent.get(o));
            }
        });
        let objectTypesToEnd = ['external_references', 'object_marking_refs', 'granular_markings'];
        let objectsToEnd = new Map();
        objectTypesToEnd.forEach((o) => {
            if (objectContent.has(o)) {
                objectsToEnd.set(o, objectContent.get(o));
                objectContent.delete(o);
            }
        });
        for (let [propName, propValue] of objectContent) {
            objectContentSorted.set(propName, propValue);
        }
        if (objectsToEnd.size > 0) {
            for (let [propName, propValue] of objectsToEnd) {
                objectContentSorted.set(propName, propValue);
            }
        }

        for (let [propName, propValue] of objectContentSorted) {
            let propNameSpan = document.createElement('span');
            propNameSpan.className = 'selected-object-prop-name';
            propNameSpan.append(propName + ':');

            let contentNodes;
            if (propName.endsWith('_ref')) contentNodes = this.stixStringContentToDOMNodes(propValue, edgeDataSet, stixIdToObject, /*isRef=*/ true);
            else if (propName.endsWith('_refs'))
                contentNodes = this.stixArrayContentToDOMNodes(propValue, edgeDataSet, stixIdToObject, /*isRefs=*/ true);
            else contentNodes = this.stixContentToDOMNodes(propValue, edgeDataSet, stixIdToObject);

            let propDiv = document.createElement('div');
            propDiv.append(propNameSpan);
            propDiv.append(...contentNodes);

            if (!topLevel) propDiv.className = 'selected-object-object-content';

            nodes.push(propDiv);
        }

        if (!topLevel) nodes.push(document.createTextNode('}'));

        return nodes;
    }

    /**
     * Create a rendering of a value, as part of rendering an overall STIX
     * object.  This function dispatches to one of the more specialized
     * rendering functions based on the type of the value.
     *
     * @param stixContent The content to render
     * @param edgeDataSet A visjs DataSet instance with graph edge data derived
     *      from STIX content
     * @param stixIdToObject A Map instance mapping STIX IDs to STIX objects as
     *      Maps, containing STIX content.
     * @return The rendering as an array of DOM elements
     */
    stixContentToDOMNodes(stixContent, edgeDataSet, stixIdToObject) {
        let nodes;

        if (stixContent instanceof Map) nodes = this.stixObjectContentToDOMNodes(stixContent, edgeDataSet, stixIdToObject);
        else if (Array.isArray(stixContent)) nodes = this.stixArrayContentToDOMNodes(stixContent, edgeDataSet, stixIdToObject);
        else if (typeof stixContent === 'string' || stixContent instanceof String)
            nodes = this.stixStringContentToDOMNodes(stixContent, edgeDataSet, stixIdToObject);
        else nodes = this.stixOtherContentToDOMNodes(stixContent);

        return nodes;
    }

    /**
     * Create a rendering of a value for which no other special rendering
     * applies, as part of rendering an overall STIX object.
     *
     * @param otherContent The content to render
     * @return The rendering as an array of DOM elements
     */
    stixOtherContentToDOMNodes(otherContent) {
        let nodes = [];

        let asText;
        if (otherContent === null) asText = 'null';
        else if (otherContent === undefined)
            asText = 'undefined'; // also just in case??
        else asText = otherContent.toString();

        let spanWrapper = document.createElement('span');
        spanWrapper.append(asText);
        spanWrapper.className = 'selected-object-nontext-value';
        nodes.push(spanWrapper);

        return nodes;
    }

    /**
     * Create a rendering of an array as part of rendering an overall STIX
     * object.
     *
     * @param arrayContent The array to render
     * @param edgeDataSet A visjs DataSet instance with graph edge data derived
     *      from STIX content
     * @param stixIdToObject A Map instance mapping STIX IDs to STIX objects as
     *      Maps, containing STIX content.
     * @param isRefs Whether the array is the value of a _refs property, i.e.
     *      an array of STIX IDs.  Used to produce a distinctive rendering for
     *      references.
     * @return The rendering as an array of DOM elements
     */
    stixArrayContentToDOMNodes(arrayContent, edgeDataSet, stixIdToObject, isRefs = false) {
        let nodes = [];

        let ol = document.createElement('ol');
        ol.className = 'selected-object-list';

        for (let elt of arrayContent) {
            let contentNodes;
            if (isRefs) contentNodes = this.stixStringContentToDOMNodes(elt, edgeDataSet, stixIdToObject, /*isRef=*/ true);
            else contentNodes = this.stixContentToDOMNodes(elt, edgeDataSet, stixIdToObject);

            let li = document.createElement('li');
            li.append(...contentNodes);
            ol.append(li);
        }

        nodes.push(document.createTextNode('['));
        nodes.push(ol);
        nodes.push(document.createTextNode(']'));

        return nodes;
    }

    /**
     * Create a rendering of a string value as part of rendering an overall
     * STIX object.
     *
     * @param stringContent The string to render
     * @param edgeDataSet A visjs DataSet instance with graph edge data derived
     *      from STIX content
     * @param stixIdToObject A Map instance mapping STIX IDs to STIX objects as
     *      Maps, containing STIX content.
     * @param isRef Whether the string is the value of a _ref property.  Used
     *      to produce a distinctive rendering for references.
     * @return The rendering as an array of DOM elements
     */
    stixStringContentToDOMNodes(stringContent, edgeDataSet, stixIdToObject, isRef = false) {
        let nodes = [];

        let spanWrapper = document.createElement('span');
        spanWrapper.append(stringContent);

        if (isRef) {
            let referentObj = stixIdToObject.get(stringContent);
            if (referentObj) {
                spanWrapper.className = 'selected-object-text-value-ref';
                spanWrapper.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.view.selectNode(referentObj.get('id'));
                    this.populateSelected(referentObj, edgeDataSet, stixIdToObject);
                });
            } else spanWrapper.className = 'selected-object-text-value-ref-dangling';
        } else spanWrapper.className = 'selected-object-text-value';

        nodes.push(spanWrapper);

        return nodes;
    }

    /**
     * Toggle the display of graph nodes of a particular STIX type.
     */
    legendClickHandler(event, view) {
        if (!view) return;

        let td;
        let clickedTagName = event.target.tagName.toLowerCase();

        if (clickedTagName === 'td')
            // ... if the legend item text was clicked
            td = event.target;
        else if (clickedTagName === 'img' || clickedTagName === 'div')
            // ... if the legend item icon was clicked
            td = event.target.parentElement;
        else return;

        // The STIX type the user clicked on
        let toggledStixType = td.textContent.trim().toLowerCase();

        view.toggleStixType(toggledStixType);

        // style change to remind users what they've hidden.
        td.classList.toggle('typeHidden');
    }

    /**
     * Build a message and display an alert window, from an exception object.
     * This will follow the exception's causal chain and display all of the
     * causes in sequence, to produce a more informative message.
     */
    alertException(exc, initialMessage = null) {
        let messages = [];

        if (initialMessage) messages.push(initialMessage);

        messages.push(exc.toString());

        while (exc instanceof Error && exc.stack) {
            exc = exc.stack;
            messages.push(exc.toString());
        }

        let message = messages.join('\n\n    Caused by:\n\n');

        alert(message);
    }

    setTab(tab) {
        switch (tab) {
            case 'selected-node': {
                this.activeTab = 'selected-node';
                break;
            }
            case 'linked-nodes': {
                this.activeTab = 'linked-nodes';
                break;
            }
            case 'legend': {
                this.activeTab = 'legend';
                break;
            }
        }
    }

    closeFullScreen() {
        this.stixService.sendData({ type: 'close-full-screen', value: false });
    }
}
