import * as d3 from "d3"
import { dagVIS, removeDagVIS } from "./right_graph";
let awesomplete = require('awesomplete');

function reloadPage() {
    window.location.reload();
}

d3.select("#header-title").on("click", reloadPage);

// global variable
let selectedClass;

export const layerChannelCounts = {
    'mixed3a': 256,
    'mixed3b': 480,
    'mixed4a': 508,
    'mixed4b': 512,
    'mixed4c': 512,
    'mixed4d': 528,
    'mixed4e': 832,
    'mixed5a': 832,
    'mixed5b': 1024
};

export const advMethodNameObj = {
    'FGSM': 'adv1',
    'AdvPatch': 'adv2',
    'AdvOpt': 'adv3'
};

const advMethodNames = ['FGSM', 'AdvPatch', 'AdvOpt']
const advMethodNum = advMethodNames.length

const modeNameObj = {
    'single layer':'mode1',
    'layer by layer':'model2'
}
let layer = 'mixed4d';
const imageDir = dataURL + 'data/imgs/';
const imageExt = '.jpg';

let imageOptions = [
    {file: 'dog_cat_lucid', class: 'labrador retriever'}];
let selectedImage = imageOptions[0].file;

imageOptions.forEach(imageOption => {
    if (imageOption.file === selectedImage) {
        selectedClass = imageOption.class
    }
})
const staticPath = dataURL + 'static/';

// left
let leftInner = d3.select('#left')
    .append('div')
    .attr('id', 'left-inner')


/* left images wrapper */
let leftInnerImageWrapper = leftInner.append('div')
    .attr('id', 'left-inner-image-wrapper')

let leftInnerImageNameWrapper = leftInnerImageWrapper.append('div')
    .classed('left-inner-value-wrapper', true)
leftInnerImageNameWrapper.append('span')
    .classed("left-inner-value-header", true)
    .style('color', '#666666')
    .text('Image')
// leftInnerImageNameWrapper.append('div')
//     .attr('id', 'left-inner-image-name')
//     .classed('left-inner-value', true)
//     .text('loading...')

let leftInnerImageOptions = leftInnerImageWrapper.append('div')
    .attr('id', 'left-inner-image-options')

imageOptions.forEach(fileAndClass => {
    leftInnerImageOptions.append('div')
        .classed('left-inner-image-container', true)
        .attr('data-imageName', fileAndClass.file)
        .on('click', function () {
            let newImageName =  d3.select(this).attr('data-imageName');

            if (newImageName !== selectedImage) {
                selectedImage = newImageName;
            }
        })
        .classed('inactive', function() {
            return selectedImage !== fileAndClass.file
        })
        .append('img')
        .attr('src', imageDir + fileAndClass.file + imageExt)
        .attr('alt', 'sampleImageName')
})

leftInnerImageOptions.append('div')
    .classed('left-inner-image-container', true)
    .classed('inactive', true)
    .attr('data-imageName', 'custom')
    .append('img')
    .classed('custom-image', true)
    .attr('src', staticPath+'plus.svg')
    .attr('alt', 'plus button')
    .attr('title', 'Add new input image')

let leftInnerImageClassWrapper = leftInnerImageWrapper.append('div')
    .classed('left-inner-value-wrapper', true)
leftInnerImageClassWrapper.append('span')
    .classed('left-inner-value-header', true)
    .text('Target Class')
leftInnerImageClassWrapper.append('div')
    .attr('id', 'left-inner-image-class')
    .classed('left-inner-value', true)
    .text('loading...')

let leftInnerClassScoreWrapper = leftInnerImageWrapper.append('div')
    .classed('left-inner-value-wrapper', true)
leftInnerClassScoreWrapper.append('span')
    .classed('left-inner-value-header', true)
    .text('Predicted Score')
leftInnerClassScoreWrapper.append('div')
    .attr('id', 'left-inner-class-score')
    .classed('left-inner-value', true)
    .text('loading...')


/* left network wrapper */
let leftInnerNetworkWrapper = leftInner.append('div')
    .attr('id', 'left-inner-network-wrapper')

let leftInnerNetworkNameWrapper = leftInnerNetworkWrapper.append('div')
    .classed('left-inner-value-wrapper', true)
leftInnerNetworkNameWrapper.append('span')
    .classed("left-inner-value-header", true)
    .text('Network')
leftInnerNetworkNameWrapper.append('div')
    .attr('id', 'left-inner-network-name')
    .classed('left-inner-value', true)
    .text('loading...')
d3.select('#left-inner-network-name').text('GoogleNet')


/* left Adv methods wrapper */
let leftInnerAdvMethodWrapper = leftInner.append('div')
    .attr('id', 'left-inner-adv-method-wrapper')

let leftInnerAdvNameWrapper = leftInnerAdvMethodWrapper.append('div')
    .classed('left-inner-value-wrapper', true)
leftInnerAdvNameWrapper.append('div')
    .classed("left-inner-value-header", true)
    .text('Advesarial Methods / Scores')

let leftInnerAdvMethodOptions = leftInnerAdvNameWrapper.append('ul')
    .attr('id', 'left-inner-adv-method-options')
    .classed('left-inner-options', true)

/* left modes wrapper */
let leftInnerModeWrapper = leftInner.append('div')
    .attr('id', 'left-inner-mode-wrapper')

let leftInnerModeNameWrapper = leftInnerModeWrapper.append('div')
    .classed('left-inner-value-wrapper', true)
leftInnerModeNameWrapper.append('div')
    .classed("left-inner-value-header", true)
    .text('Mode')

let leftInnerModeOptions = leftInnerModeNameWrapper.append('ul')
    .attr('id', 'left-inner-mode-options')
    .classed('left-inner-options', true)

// right
let rightInnerDagWrapper = d3.select('#right')
    .append('div')
    .attr('id', 'right-inner-dag-wrapper')

// Draw inner things
const formatFixedPoint = d3.format('.2f')
const accuracyMargin = { top: 0, right: 0, bottom: 1, left: 0 }
const accuracyWidth = 120 - accuracyMargin.left - accuracyMargin.right
const accuracyHeight = 20 - accuracyMargin.top - accuracyMargin.bottom

// Promise.all(
//     jsonFileNames.map(d3.json)).then(function (files) {

let jsonFileNames = [dataURL + 'data/json/' + selectedImage + '.json']
for(let i=0; i<advMethodNum; i++){
    jsonFileNames.push(dataURL + 'data/json/' + selectedImage + '-adv' + (i+1) + '.json')
}

Promise.all(jsonFileNames.map(jsonFileName => d3.json(jsonFileName))).then(function (files) {
    let data = files[0]
    d3.select('#left-inner-image-class').text(selectedClass)
    d3.select('#left-inner-class-score').text(formatFixedPoint(data[selectedClass]['pred_score']))

    function getCurrCheckedAdvMethodNames(){
        let allImageNames = [selectedImage]
        // let leftInnerCheckedAdvMethods = d3.selectAll('input[name=adv-method-option]:checked');
        let leftInnerCheckedAdvMethods = document.querySelectorAll("input[name=adv-method-option]:checked");
        leftInnerCheckedAdvMethods.forEach(leftInnerCheckedAdvMethod => {
            allImageNames.push(selectedImage + '-' + leftInnerCheckedAdvMethod['id']);
        });
        return allImageNames
    }
    
    advMethodNames.forEach((advMethodName, advMethodNameIndex) => {
        let leftInnerAdvMethodOption = leftInnerAdvMethodOptions.append('li')
            .classed('left-inner-option-container', true)
        leftInnerAdvMethodOption.append('input')
            .attr('type', 'checkbox')
            .attr('name', 'adv-method-option')
            .attr('id', 'adv' + (advMethodNameIndex+1))
            .attr('checked', 'true')
        leftInnerAdvMethodOption.append('label')
            .attr('for', 'adv' + (advMethodNameIndex+1))
            .classed('left-inner-value', true)
            .style('margin-left', '0px')
            .text(advMethodName)
        leftInnerAdvMethodOption.append('span')
            .attr('id', 'adv' + (advMethodNameIndex+1)+'score')
            .classed('left-inner-value', true)
            .style('float', 'right')
            .style('margin-right', '45px')
            .text(formatFixedPoint(files[advMethodNameIndex+1][selectedClass]['pred_score']))
    })

    advMethodNames.forEach((advMethodName, advMethodNameIndex) => {
        const checkbox = document.getElementById('adv' + (advMethodNameIndex+1))
        checkbox.addEventListener('change', (event) => {
            let allImageNames = getCurrCheckedAdvMethodNames();
            let modeName = getCurrRadioedModeName();
            if (event.target.checked) {
                d3.select('#' + 'adv' + (advMethodNameIndex+1)+'score').text(formatFixedPoint(files[advMethodNameIndex+1][selectedClass]['pred_score']))
            } else {
                d3.select('#' + 'adv' + (advMethodNameIndex+1)+'score').text('Loading')
            }
            removeDagVIS()
            dagVIS(allImageNames, layer, modeName, selectedClass)
        })
    })

    function getCurrRadioedModeName(){
        let modeName = document.querySelector("input[name=mode-option]:checked")['id'];
        return modeName
    }

    for (const [key, value] of Object.entries(modeNameObj)) {
        let leftInnerModeOption = leftInnerModeOptions.append('li')
            .classed('left-inner-option-container', true)
        leftInnerModeOption.append('input')
            .attr('type', 'radio')
            .attr('name', 'mode-option')
            .attr('id', value)
            .attr('checked')
        leftInnerModeOption.append('label')
            .attr('for', value)
            .classed('left-inner-value', true)
            .style('margin-left', '0px')
            .text(key)
    }

    for (const [key, value] of Object.entries(modeNameObj)) {
        const radio = document.getElementById(value);
        radio.addEventListener('change', (event) => {
            let allImageNames = getCurrCheckedAdvMethodNames();
            let modeName = getCurrRadioedModeName();
            removeDagVIS()
            dagVIS(allImageNames, layer, modeName, selectedClass);
        })
    }

    function makeNetSVG(layer) {
        let leftInnerNetworkLayerLabel = leftInnerNetworkWrapper
            .append('div')
            .classed('left-inner-value-wrapper', true)

        leftInnerNetworkLayerLabel
            .append('div')
            .classed("left-inner-value-header", true)
            .text('layer')

        leftInnerNetworkLayerLabel
            .append('div')
            .attr('id', 'left-inner-layer-name')
            .classed("left-inner-value", true)
            .text(layer)

        let leftInnerNetworkLayerOptionsLabel =  leftInnerNetworkWrapper.append('div')
            .attr('id', 'left-inner-layer-options')
            .classed('left-inner-value-wrapper', true)

        const netMargin = ({ top: 0, right: 20, bottom: 5, left: 5})
        const netWidth = 260 - netMargin.left - netMargin.right
        const netHeight = 40// - netMargin.top - netMargin.bottom

        let networkSVG = leftInnerNetworkLayerOptionsLabel
            .append('svg')
            .attr('width', netWidth + 'px')
            .attr('height', netHeight + 'px')
            .append("g")
            .attr("transform", "translate(" + netMargin.left + "," + netMargin.top + ")")
            .attr('id', 'net')

        networkSVG.append('filter')
            .attr('id', 'glyph-drop-shadow')
            .attr('x', "-50%")
            .attr('y', "-50%")
            .attr('width', "200%")
            .attr('height', "200%")
            .append('feDropShadow')
            .attr('dx', "0")
            .attr('dy', "0")
            .attr('stdDeviation', "3")
            .attr('flood-color', "rgba(0, 0, 0, 0.6)")
            .attr('flood-opacity', "1")

        let layers = Object.keys(layerChannelCounts);

        const netLayerWidth = 20
        const netLayerPadding = (netWidth - netMargin.left - netMargin.right - (layers.length-1) * netLayerWidth) / layers.length

        let layerGGlyphs = networkSVG
            .selectAll('.layer-glyph-wrapper')
            .data(layers)
            .enter()
            .append('g')
            .classed('layer-glyph-wrapper', true)
            .on('mouseover', d => {
                d3.select('#layer-glyph-' + d)
                    .classed('layer-glyph-hover', true)
                    .attr('filter', 'url(#glyph-drop-shadow)')
            })
            .on('mouseout', d => {
                d3.select('#layer-glyph-' + d)
                    .classed('layer-glyph-hover', false)
                    .attr('filter', null)
            })
            .on('click', (d) => {
                // update layer
                layer = d
                d3.selectAll('.layer-glyph')
                    .classed('layer-glyph-selected', false)
                d3.select('#layer-glyph-' + layer)
                    .classed('layer-glyph-selected', true)
                d3.select('#left-inner-layer-name')
                    .text(layer)
                let allImageNames = getCurrCheckedAdvMethodNames();
                let modeName = getCurrRadioedModeName();
                removeDagVIS()
                dagVIS(allImageNames, layer, modeName, selectedClass)
            })

        layerGGlyphs.append('rect')
            .attr('x', (d, i) => i * (netLayerWidth + netLayerPadding))
            .attr('y', 0)
            .attr('width', netLayerWidth)
            .attr('height', netHeight - netMargin.top - netMargin.bottom)
            .attr('rx', '3px')
            .attr('ry', '3px')
            .classed('layer-glyph', true)
            .attr('id', d => 'layer-glyph-' + d)

        layerGGlyphs
            .append('text')
            .text(d => d.slice(5))
            .attr('x', (d, i) => i * (netLayerWidth + netLayerPadding) + netLayerWidth/2)
            // .attr('y', netHeight - 10)
            .attr('y', (netHeight - netMargin.top - netMargin.bottom)/2 + 4)
            .attr('text-anchor', 'middle')
            .classed('layer-glyph-label', true)

        d3.select('#layer-glyph-' + layer)
            .classed('layer-glyph-selected', true) // init selected layer
    }

    makeNetSVG(layer)
    d3.select('#mode1')
        .attr('checked', true)
    let allImageNames = getCurrCheckedAdvMethodNames();
    let modeName = getCurrRadioedModeName();
    dagVIS(allImageNames, layer, modeName, selectedClass)
})

d3.selection.prototype.moveToFront = function() {
    return this.each(function(){
        this.parentNode.appendChild(this);
    });
};
