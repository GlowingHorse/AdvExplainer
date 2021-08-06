import * as d3 from "d3"
import {layerChannelCounts} from './left_select'
import { createGunzip } from "zlib";
import { createPrivateKey } from "crypto";

let rightInnerDagWrapper = d3.select('#right-inner-dag-wrapper')

let layers = Object.keys(layerChannelCounts).reverse()
let isAlreadyClicked = {}

const dagMargin = ({ top: 40, right: 40, bottom: 40, left: 40 })
const dagWidth = 2800 - dagMargin.left - dagMargin.right
const dagHeight = 3000 - dagMargin.top - dagMargin.bottom // 790 based on laptop screen height
let k = 1; // dag zoom scale
let numTopAttr = 3;
const filterTransitionSpeed = 1000
let filterFilterValue = 0;

// feature vis
const imageExt = '.jpg';
const exLayout = ({ offset: 20, top: 20, bottom: 5, right: 2, left: 5, TBPadding: 2, textPadding: 5 })
const exRectLayout = ({ offset: 13, right: 2, left: 5 })
const attrLayout = ({ topOffset: 60, top: 15, left: 3, right: 3, bottom: 3 })

let fvWidth, fvHeight, hmWidth, hmHeight;
fvWidth = fvHeight = 250

let deWidth, deHeight;
deWidth = deHeight= 30

let imgWidth, imgHeight;
imgWidth = imgHeight = 250

let layerVerticalSpace = 400
let imgHorizontalSpace = 800
let fvHorizontalSpace = 200

const edgeSize = 30

const binMargin = { top: 0, right: 5, bottom: 2, left: 5}
const binWidth = fvHeight - binMargin.left - binMargin.right
const binHeight = 150 - binMargin.top - binMargin.bottom

/*这一套组合是过去的d3库的规范写法
利用d3.zoom创建一个函数
然后里面具体zoomed函数就是用d3select指定元素并应用d3transform*/
let zoom = d3.zoom()
    .scaleExtent([.1, 3.5])
    .extent([[0, 0], [dagWidth, dagHeight]])
    .on("zoom", zoomed);

function zoomed() {
    d3.select('#dagG').attr("transform", d3.event.transform);
    // console.log(d3.event.transform)
}

let dagSVG = rightInnerDagWrapper
    .append('svg')
    .attr('viewBox', '0 0 ' + (dagWidth + dagMargin.left + dagMargin.right) + ' ' + (dagHeight + dagMargin.top + dagMargin.bottom))
    .attr('width', '100%')
    .style('border-bottom', '1px solid rgba(0, 0, 0, 0.1)')
    .attr('id', 'dag')

dagSVG.append('filter')
    .attr('id', 'grayscale-filter')
    .append('feColorMatrix')
    .attr('type', 'matrix')
    .attr('values', '0.3333 0.3333 0.3333 0 0 0.3333 0.3333 0.3333 0 0 0.3333 0.3333 0.3333 0 0 0 0 0 1 0')

dagSVG.append('filter')
    .attr('id', 'transparent-filter')
    .append('feColorMatrix')
    .attr('type', 'matrix')
    .attr('values', "1 0 0 0 0" +
        " 0 1 0 0 0" +
        " 0 0 1 0 0" +
        " 0 0 0 0.5 0")

// 此处x y等处赋予的百分号的数值%
// 是与父元素的坐标相乘并将结果应用为子元素的坐标
// 宽高定义类似
dagSVG.append('filter')
    .attr('id', 'drop-shadow-filter')
    .attr('y',"-50%")
    .attr('width', "200%")
    .attr('height', "200%")
    .append('feDropShadow')
    .attr('dx',"0")
    .attr('dy',"0")
    .attr('stdDeviation',"8")
    .attr('flood-color', "rgba(0, 0, 0, 0.6)")
    .attr('flood-opacity',"1")

let zoomRect = dagSVG.append("rect")
    .attr("width", dagWidth + dagMargin.left + dagMargin.right)
    .attr("height", dagHeight + dagMargin.top + dagMargin.bottom)
    .style("fill", "none")
    .style("pointer-events", "all")
    // .attr('transform', 'translate(' + dagMargin.left + ',' + dagMargin.top + ')')
    .call(zoom);

let dagDefs = dagSVG.append('defs')

let channelsHidden = new Set()

let leftInner = d3.select('#left-inner')
let leftInnerScaleWrapper = leftInner
    .append('div')
    .attr('id', 'left-inner-scale-wrapper')

// home zoom button
let leftInnerScaleMethodWrapper = leftInnerScaleWrapper.append('div')
    .classed('left-inner-value-wrapper', true)
leftInnerScaleMethodWrapper.append('span')
    .classed("left-inner-value-header", true)
    .text('Reset zoom')
leftInnerScaleMethodWrapper.append('button')
    .attr('type', 'button')
    .classed('square-button', true)
    .attr('title', 'Reset zoom')
    .append('i')
    .classed('material-icons', true)
    .classed('md-24', true)
    .text('zoom_out_map')
    .attr('id', 'dag-home')

let leftInnerFilterGraphWrapper = leftInnerScaleWrapper.append('div')
    .classed('left-inner-value-wrapper', true)
leftInnerFilterGraphWrapper.append('span')
    .classed("left-inner-value-header", true)
    .text('filter graph')
leftInnerFilterGraphWrapper.append('div')
    .classed('left-inner-value', true)
    .append('input')
    .attr('type', 'range')
    .attr('id', 'dag-channel-count-filter-slider')
    .attr('min', 0)
    .attr('max', 1300)
    .attr('value', 0)
    .classed('slider', true)
    .attr('title', 'Filter graph by removing less important channels')

let leftInnerFilterWidth = leftInnerScaleWrapper.append('div')
    .classed('left-inner-value-wrapper', true)
leftInnerFilterWidth.append('span')
    .classed("left-inner-value-header", true)
    .text('adjust width')
leftInnerFilterWidth.append('div')
    .classed("left-inner-value", true)
    .append('input')
    .attr('type', 'range')
    .attr('id', 'dag-width-filter-slider')
    .attr('min', 0)
    .attr('max', 300)
    .attr('value', fvHorizontalSpace)
    .classed('slider', true)
    .attr('title', 'Change width of attribution graph')

let leftInnerFilterHeight = leftInnerScaleWrapper.append('div')
    .classed('left-inner-value-wrapper', true)
leftInnerFilterHeight.append('span')
    .classed("left-inner-value-header", true)
    .text('adjust height')
leftInnerFilterHeight.append('div')
    .classed('left-inner-value', true)
    .append('input')
    .attr('type', 'range')
    .attr('id', 'dag-height-filter-slider')
    .attr('min', 175)
    .attr('max', 400)
    .attr('value', layerVerticalSpace)
    .classed('slider', true)
    .attr('title', 'Change height of attribution graph')

const formatFixedPoint = d3.format('.2f')

function toTitleCase(str) {
    return str.replace(
        /\w\S*/g,
        function(txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        }
    );
}

export function dagVIS(allImageNames, layer, modeName, selectedClass) {
    let jsonFileNames = []
    let allImageNum = allImageNames.length
    for(let i=0; i<allImageNum; i++){
        jsonFileNames.push(dataURL + 'data/json/' + allImageNames[i] + '.json')
    }
    let imageSuffix = ['ori'];
    let advNameReResult;
    for(let i=1; i<allImageNum; i++){
        advNameReResult = /adv[0-9]/g.exec(allImageNames[i])
        imageSuffix.push(advNameReResult[0])
    }

    let underImageLabels = ['original Image'];
    for(let i=1; i<allImageNum; i++){
        if(imageSuffix[i] === 'adv1'){
            underImageLabels.push("FGSM adversarial attack")
        }
        else if(imageSuffix[i] === 'adv2'){
            underImageLabels.push("adversarial patch attack")
        }
        else{
            underImageLabels.push("optimized adversarial attack")
        }
    }

    Promise.all(jsonFileNames.map(jsonFileName => d3.json(jsonFileName))).then(function (files) {
        let modeLayers;
        let layerLabels;
        if(modeName === 'mode1'){
            const layerIndex = {
                'sub': 3,
                'int': 2,
                'input': 0
            }
            layerIndex[layer] = 1
            const indexLayer = {
                3: 'sub',
                2: 'int',
                0: 'input'
            }
            indexLayer[1] = layer;
            let layerConnectedWithInput = layer;
            modeLayers = Object.keys(layerIndex).sort(function(a,b){return layerIndex[a]-layerIndex[b]})
            layerLabels = ['Input images', modeLayers[1], 'Integrated visualizations'];
        }
        else{
            const layerIndex = {
                'input'  : 0,
                'mixed3a': 1,
                'mixed3b': 2,
                'mixed4a': 3,
                'mixed4b': 4,
                'mixed4c': 5,
                'mixed4d': 6,
                'mixed4e': 7,
                'mixed5a': 8,
                'mixed5b': 9
            };

            const indexLayer = {
                0:'input',
                1:'mixed3a',
                2:'mixed3b',
                3:'mixed4a',
                4:'mixed4b',
                5:'mixed4c',
                6:'mixed4d',
                7:'mixed4e',
                8:'mixed5a',
                9:'mixed5b'
            }

            if(layer === 'mixed3a'){
                let layerConnectedWithInput = 'mixed3a';
            }
            else{
                let layerConnectedWithInput = indexLayer[layerIndex[layer]-1];
            }
        }
        // console.log(jsonFileNames);
        // console.log(layer);
        // console.log(modeName);

        // Compute Heatmap size scale in all layers
        let binSizeScaleAllLayers = Object()
        let layerEdgeSizeScaleAllLayers = Object()
        layers.forEach(layerName => {
            let tempCountMaxs = []
            for(let j=0; j<allImageNum; j++){
                tempCountMaxs.push(d3.max(files[j][selectedClass]['layers'][layerName]['channels'], d=>{return d['channel_R_contrib']}))
            }
            binSizeScaleAllLayers[layerName] = d3.scaleLinear()
                .domain([0, d3.max(tempCountMaxs)])
                .range([binHeight/8, binHeight])
            layerEdgeSizeScaleAllLayers[layerName] = d3.scaleLinear()
                .domain([0, d3.max(tempCountMaxs)])
                .range([0, edgeSize])
        })

        // Compute scale size of attribution graphs connected with input images
        let inputEdgeSizeScaleAllLayers = Object()
        layers.forEach(layerName => {
            let tempCountMaxs = []
            for(let j=0; j<allImageNum; j++){
                tempCountMaxs.push(d3.max(files[j][selectedClass]['layers'][layerName]['channels'], d=>{return d['channel_AM_contrib']}))
            }
            inputEdgeSizeScaleAllLayers[layerName] = d3.scaleLinear()
                .domain([0, d3.max(tempCountMaxs)])
                .range([0, edgeSize/1.3])
        })

        function computeImageCoordinates(){
            allImageNames.forEach((imageName, i)=> {
                files[i][selectedClass].width = imgWidth
                files[i][selectedClass].x = ((imgWidth + imgHorizontalSpace)*i -
                    ((allImageNum*imgWidth + (allImageNum-1)*imgHorizontalSpace) /2))
                files[i][selectedClass].y = dagHeight - imgHeight
            })
        }

        function newImageClipPath(imageNameIndex) {
            dagDefs.append('clipPath')
                .attr('id', 'img-clip-path-' + allImageNames[imageNameIndex])
                .append('rect')
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', files[imageNameIndex][selectedClass].width)
                .attr('height', files[imageNameIndex][selectedClass].width)
                .attr('rx', 8)
                .attr('ry', 8)
        }

        if (modeName === 'mode1') {
            let fileNum = files.length;
            let tempSingleLayerAttrMaxs = [];
            // 为过滤fv数量设计的range input设定最大值
            for (let i=0; i<fileNum; i++) {
                tempSingleLayerAttrMaxs.push(d3.max(files[i][selectedClass]['layers'][layer]['channels'], d => {
                    return d.channel_R_contrib
                }))
            }

            const attrScaleCountMax = d3.max(tempSingleLayerAttrMaxs)

            // 在原始svg基础上向下和右分别偏移了40px dagMargin.left
            let dagG = dagSVG
                .append("g")
                .attr("transform", "translate(" + dagMargin.left + "," + dagMargin.top + ")")
                .attr('id', 'dagG')

            d3.select('#dag-channel-count-filter-slider')
                .attr('max', attrScaleCountMax)

            function drawOrigin() {
                dagG.append('circle')
                    .attr('r', 10)
                    .attr('cx', 0)
                    .attr('cy', 0)
            }
            // for debugging, draw point at origin of svg
            // drawOrigin()

            function centerDag() {
                zoomRect.transition().duration(750).call(zoom.transform, d3.zoomIdentity.translate(1200, -100).scale(0.45));
            }
            centerDag()
            d3.select('#dag-home').on('click', () => {
                centerDag()
            })

            function mouseOutHighlightAllMode1(){
                d3.selectAll('.figure-show').attr('filter', null)
                allImageNames.forEach((imageName, imageNameIndex) => {
                    d3.select('#input' + '-' + imageNameIndex + '-figure')
                        .attr('xlink:href', dataURL + 'data/imgs/' + imageName + imageExt)
                    d3.selectAll('.dag-edge').classed('dag-edge-animate-in-'+imageNameIndex, false)
                    d3.selectAll('.dag-edge').classed('dag-edge-animate-out-'+imageNameIndex, false)
                })
            }

            function mouseOverHighlightFigures(d, i, innerLayerName){
                // d为图像名字,i为图像索引
                // d或为channel,i为channel索引
                // d为adv图像名字,i为adv图像索引 (需要+1)
                let nextLayerName, prevLayerName;
                if(modeLayers.indexOf(innerLayerName) !== modeLayers.length-1){
                    nextLayerName = modeLayers[modeLayers.indexOf(innerLayerName)+1]
                }
                if(modeLayers.indexOf(innerLayerName) !== 0){
                    prevLayerName = modeLayers[modeLayers.indexOf(innerLayerName)-1]
                }
                // 把全部都变灰
                d3.selectAll('.figure-show').attr('filter', 'url(#grayscale-filter)')

                // 有针对性地变亮
                if(innerLayerName === 'input'){
                    d3.select('#' + innerLayerName + '-' +
                        i + '-figure').attr('filter', null)
                    d3.selectAll('.' + nextLayerName + '-figures').attr('filter', null)
                    // 把连接着下一层的edge都加上动画
                    d3.selectAll('.dag-edge-' + innerLayerName + '-' + i + '-' + 'out')
                        .classed('dag-edge-animate-out-'+i, true)
                    d3.selectAll('.' + nextLayerName + '-' + i + '-bins').attr('filter', null)
                }
                else if(innerLayerName === 'int'){
                    // d为图像名字,i为图像索引,innerLayerName为int
                    d3.selectAll('.' + prevLayerName + '-figures').attr('filter', null)
                    d3.selectAll('.' + prevLayerName + '-' + i +'-bins').attr('filter', null)
                    d3.selectAll('.dag-edge-' + innerLayerName + '-' + i + '-in')
                        .classed('dag-edge-animate-in-' + i, true).attr('filter', null)
                    d3.selectAll('.' +  innerLayerName + '-' + i + '-figures').attr('filter', null)
                    d3.selectAll('.dag-edge-' + innerLayerName + '-' + i + '-out')
                        .classed('dag-edge-animate-in-' + i, true)
                }
                else if(innerLayerName === 'sub'){
                    d3.selectAll('.' +  prevLayerName + '-0' + '-figures').attr('filter', null)
                    d3.selectAll('.' +  prevLayerName + '-' + (i+1) + '-figures').attr('filter', null)
                    d3.selectAll('.dag-edge-' + innerLayerName + '-' + (i+1) + '-in')
                        .classed('dag-edge-animate-in-'+0, true)
                    d3.selectAll('.' +  innerLayerName + '-' + (i+1) + '-figures').attr('filter', null)
                }
                else{
                    d3.selectAll('.' + prevLayerName + '-figures').attr('filter', null)
                    allImageNames.forEach((imageName, imageNameIndex) => {
                        d3.select('#' + prevLayerName + '-' + imageNameIndex + '-figure')
                            .attr('xlink:href', dataURL + 'data/vis/' + allImageNames[0] + '/' + selectedClass + '/HM-' +
                                imageSuffix[imageNameIndex] + '-' + innerLayerName + '-' + d.channel + imageExt)
                        d3.selectAll('.dag-edge-' + innerLayerName + '-' + d.channel + '-' + imageNameIndex +'-in')
                            .classed('dag-edge-animate-in-'+imageNameIndex, true)
                        d3.selectAll('.dag-edge-' + innerLayerName + '-' + d.channel + '-' + imageNameIndex+ '-out')
                            .classed('dag-edge-animate-out-'+imageNameIndex, true)
                        d3.select('#' + innerLayerName + '-' + d.channel + '-' + imageNameIndex + '-bin').attr('filter', null)
                    })
                    d3.select('#' + innerLayerName + '-' + d.channel + '-figure').attr('filter', null)
                    d3.selectAll('.' + nextLayerName + '-figures').attr('filter', null)
                }
            }

            function mouseOverHighlightEdges(d, i, innerLayerName, imageNameIndex){
                // d为图像名字,i为图像索引
                // d或为channel,i为channel索引,
                // d为adv图像名字,i为adv图像索引 (需要+1)
                let nextLayerName, prevLayerName;
                if(modeLayers.indexOf(innerLayerName) !== modeLayers.length-1){
                    nextLayerName = modeLayers[modeLayers.indexOf(innerLayerName)+1]
                }
                if(modeLayers.indexOf(innerLayerName) !== 0){
                    prevLayerName = modeLayers[modeLayers.indexOf(innerLayerName)-1]
                }

                // 把全部都变灰
                d3.selectAll('.figure-show').attr('filter', 'url(#grayscale-filter)')

                if(innerLayerName === 'input') {
                    // innerLayerName为当前层名字, imageNameIndex为图像索引, d为channel,i为channel索引
                    // 点亮对应图像
                    d3.select('#' + innerLayerName + '-' +
                        imageNameIndex + '-figure').attr('filter', null)
                    // 点亮对应fv
                    d3.select('#' + nextLayerName + '-' + d.channel + '-figure').attr('filter', null)
                    // 点亮对应的bin
                    d3.select('#' + nextLayerName + '-' + d.channel + '-' +
                        imageNameIndex + '-bin').attr('filter', null)
                }
                else if(innerLayerName === 'int'){
                    // innerLayerName为当前层名字, imageNameIndex为图像索引, d为adv图像名字,i为adv图像索引 (需要+1)
                    if(imageNameIndex === 0){
                        d3.selectAll('.' +  innerLayerName + '-' + imageNameIndex + '-figures').attr('filter', null)
                        d3.selectAll('.' +  innerLayerName + '-' + (i+1) + '-figures').attr('filter', null)
                        d3.selectAll('.' +  nextLayerName + '-' + (i+1) + '-figures').attr('filter', null)
                        d3.selectAll('.dag-edge-' + nextLayerName + '-' + (i+1) + '-in')
                            .classed('dag-edge-animate-in-'+imageNameIndex, true)
                    }
                    else{
                        d3.selectAll('.' +  innerLayerName + '-' + 0 + '-figures').attr('filter', null)
                        d3.selectAll('.' +  innerLayerName + '-' + imageNameIndex + '-figures').attr('filter', null)
                        d3.selectAll('.' +  nextLayerName + '-' + imageNameIndex + '-figures').attr('filter', null)
                        d3.selectAll('.dag-edge-' + nextLayerName + '-' + imageNameIndex + '-in')
                            .classed('dag-edge-animate-in-'+imageNameIndex, true)
                    }
                }
                else{
                    d3.select('#' + innerLayerName + '-' + d.channel + '-figure').attr('filter', null)
                    d3.select('#' + innerLayerName + '-' + d.channel + '-' +
                        imageNameIndex + '-bin').attr('filter', null)
                    d3.selectAll('.' +  nextLayerName + '-' + imageNameIndex + '-figures').attr('filter', null)
                }
            }

            function newFvClipPathMode1(channel){
                dagDefs.append('clipPath')
                    .attr('id', 'fv-clip-path-' + layer + '-' + channel.channel)
                    .append('rect')
                    .attr('x', 0)
                    .attr('y', 0)
                    .attr('width', channel.fvwidth)
                    .attr('height', channel.fvwidth)
                    .attr('rx', 8)
                    .attr('ry', 8)
            }

            function newBinClipPathMode1(channel){
                dagDefs.append('clipPath')
                    .attr('id', 'bin-clip-path-' + layer + '-' + channel.channel)
                    .append('rect')
                    .attr('x', 0)
                    .attr('y', 0)
                    .attr('width', binWidth)
                    .attr('height', binHeight)
                    .attr('rx', 8)
                    .attr('ry', 8)
            }

            function newIntClipPathMode1(imageNameIndex){
                dagDefs.append('clipPath')
                    .attr('id', 'intfv-clip-path-' + imageSuffix[imageNameIndex])
                    .append('rect')
                    .attr('x', 0)
                    .attr('y', 0)
                    .attr('width', files[imageNameIndex][selectedClass].width)
                    .attr('height', files[imageNameIndex][selectedClass].width)
                    .attr('rx', 8)
                    .attr('ry', 8)
                dagDefs.append('clipPath')
                    .attr('id', 'inthm-clip-path-' + imageSuffix[imageNameIndex])
                    .append('rect')
                    .attr('x', 0)
                    .attr('y', 0)
                    .attr('width', files[imageNameIndex][selectedClass].width)
                    .attr('height', files[imageNameIndex][selectedClass].width)
                    .attr('rx', 8)
                    .attr('ry', 8)
            }

            function newSubClipPathMode1(imageNameIndex){
                dagDefs.append('clipPath')
                    .attr('id', 'subhm-clip-path-' + imageSuffix[imageNameIndex])
                    .append('rect')
                    .attr('x', 0)
                    .attr('y', 0)
                    .attr('width', files[imageNameIndex][selectedClass].width)
                    .attr('height', files[imageNameIndex][selectedClass].width)
                    .attr('rx', 8)
                    .attr('ry', 8)
                dagDefs.append('clipPath')
                    .attr('id', 'subicon-clip-path-' + imageSuffix[imageNameIndex])
                    .append('rect')
                    .attr('x', 0)
                    .attr('y', 0)
                    .attr('width', imgWidth)
                    .attr('height', imgWidth)
                    .attr('rx', 8)
                    .attr('ry', 8)
            }

            function computeFvCoordinatesMode1(){
                for(let imageNameIndex=0; imageNameIndex<allImageNum; imageNameIndex++) {
                    files[imageNameIndex][selectedClass]['layers'][layer]['channels'].forEach((ch, i) => {
                        ch.fvwidth = fvWidth
                        // 代码第一行是每次fv宽度加上横向间隔,来确定i个该在的位置
                        // 代码第二行是总长度的一半,作为偏移基准
                        ch.fvx = (((fvWidth + fvHorizontalSpace) * i) -
                            ((files[0][selectedClass]['layers'][layer]['channels'].length * fvWidth +
                                (files[0][selectedClass]['layers'][layer]['channels'].length - 1) * fvHorizontalSpace) / 2))
                        ch.fvy = files[0][selectedClass].y - layerVerticalSpace - fvHeight
                    });
                }
            }

            function computeAttrBinCoordinatesMode1(){
                for(let imageNameIndex=0; imageNameIndex<allImageNum; imageNameIndex++) {
                    files[imageNameIndex][selectedClass]['layers'][layer]['channels'].forEach((ch, i) => {
                        ch.binwidth = binWidth
                        ch.binx = ch.fvx + binMargin.left
                        ch.biny = ch.fvy-(binHeight+binMargin.top + binMargin.bottom)
                    });
                }
            }

            function computeIntCoordinatesMode1(){
                allImageNames.forEach((imageName, i)=> {
                    files[i][selectedClass].intfvx = files[i][selectedClass].x
                    files[i][selectedClass].inthmx = files[i][selectedClass].x
                    files[i][selectedClass].intfvy = files[0][selectedClass]['layers'][layer]['channels'][0].fvy - fvHeight - layerVerticalSpace
                    files[i][selectedClass].inthmy = files[i][selectedClass].intfvy - files[i][selectedClass].width
                })
            }

            function computeSubCoordinatesMode1(){
                for(let i=1; i<allImageNum; i++){
                    files[i][selectedClass].subhmx = (files[i-1][selectedClass].x +
                        files[i][selectedClass].x)/2
                    files[i][selectedClass].subhmy = files[0][selectedClass].inthmy
                    files[i][selectedClass].subiconx = files[i][selectedClass].subhmx + imgWidth/4
                    files[i][selectedClass].subicony = files[i][selectedClass].subhmy - layerVerticalSpace/2
                }
            }

            function drawImagesMode1(innerLayerName){
                dagG.append('g')
                    .classed(innerLayerName + '-figures-group', true)
                    .selectAll('.' + innerLayerName + '-figures')
                    .data(allImageNames)
                    .enter()
                    .append('image')
                    .attr('x', 0)
                    .attr('y', 0)
                    .attr('width', imgWidth)
                    .attr('height', imgWidth)
                    .attr('xlink:href', d => {
                        let filename = dataURL + 'data/imgs/' + d + imageExt
                        return filename
                    })
                    .attr('clip-path', d => 'url(#img-clip-path-' + d + ')')
                    .attr("transform", (d, i) => "translate(" +
                        files[i][selectedClass].x + ',' +
                        files[i][selectedClass].y + " )"
                    )
                    .attr('class', (d, i) => {
                        return innerLayerName + '-figures' +
                            ' ' + 'figure-show'
                    })
                    .attr('id', (d, i) => innerLayerName + '-' + i + '-figure')
                    .on('mouseover', function (d, i) {
                        mouseOverHighlightFigures(d, i, innerLayerName)
                    })
                    .on('mouseout', (d, i) => {
                        mouseOutHighlightAllMode1()
                    })
            }

            function drawFvChannelsMode1(innerLayerName){
                dagG.append('g')
                    .classed('one-layer-FVs-group', true)
                    .selectAll('.' + innerLayerName + '-figures')
                    .data(files[0][selectedClass]['layers'][innerLayerName]['channels'])
                    .enter()
                    .append('image')
                    .attr('x', 0)
                    .attr('y', 0)
                    .attr('width', fvWidth)
                    .attr('height', fvHeight)
                    .attr('xlink:href', d => {
                        let filename = dataURL + 'data/vis/channel/' + innerLayerName + '-' + d.channel + '-channel' + imageExt
                        return filename
                    })
                    .attr('clip-path', d => 'url(#fv-clip-path-' + innerLayerName + '-' + d.channel + ')')
                    .attr("transform", (d, i) => "translate(" +
                        d.fvx + ',' +
                        d.fvy + " )"
                    )
                    .attr('id', d => innerLayerName + '-' + d.channel + '-figure')
                    .classed('figure-show', true)
                    .classed(innerLayerName + '-figures', true)
                    .on('mouseover', function (d, i) {
                        mouseOverHighlightFigures(d, i, innerLayerName)
                    })
                    .on('mouseout', mouseOutHighlightAllMode1)
            }

            function drawAttrBinsMode1(innerLayerName){
                dagG.append('g')
                    .classed('one-layer-attr-bins-group', true)
                    .selectAll('.' + innerLayerName + '-bins')
                    .data(files[0][selectedClass]['layers'][innerLayerName]['channels'])
                    .enter()
                    // .attr("width", binWidth)
                    // .attr("height", binHeight)
                    .append("g")
                    .attr("transform", (d, i) => "translate(" +
                        d.binx + ',' +
                        d.biny + ")")
                    .attr('id', d => innerLayerName + '-' + d.channel + '-bins')

                for (let c = 0; c < files[0][selectedClass]['layers'][innerLayerName]['channels'].length; c++) {
                    let ch = files[0][selectedClass]['layers'][innerLayerName]['channels'][c]
                    let imageAttrInLayer = []
                    allImageNames.forEach((imageName, imageNameIndex) => {
                        imageAttrInLayer.push(files[imageNameIndex][selectedClass]['layers'][innerLayerName]['channels'][c]['channel_R_contrib'])
                    })
                    const singleBinWidth = ch.binwidth / imageAttrInLayer.length
                    let binGroup = d3.select('#' + innerLayerName + '-' + ch.channel + '-bins')

                    let binX = d3.scaleLinear()
                        .domain([0, imageAttrInLayer.length]).nice()
                        .range([0, binWidth])

                    binGroup.append('g')
                        .attr("transform", (d, i) => "translate(" +
                            0 + ',' +
                            binHeight + " )")
                        .classed('bin-x-axis', true)
                        .call(d3.axisBottom(binX).tickSizeOuter(0).ticks(0))

                    binGroup
                        .append("g")
                        .selectAll("rect")
                        .data(imageAttrInLayer)
                        .enter().append("rect")
                        .attr('id', (d, i) => {return innerLayerName + '-' +
                            files[i][selectedClass]['layers'][innerLayerName]['channels'][c].channel +
                            '-' + i + '-bin'})
                        .attr('class', (d, i) => {return 'attr-bin' +
                            ' ' + 'attr-bin-' + i +
                            ' ' + innerLayerName + '-' + i + '-bins' +
                            ' ' + 'figure-show'})
                        .classed(innerLayerName + '-bins', true)
                        .attr("x", (d, i) => i*singleBinWidth) // + 1?
                        .attr("width", singleBinWidth)
                        .attr("y", (d, i) => Math.round(binHeight -
                            binSizeScaleAllLayers[layer](files[i][selectedClass]['layers'][innerLayerName]['channels'][c]['channel_R_contrib'])))
                        .attr("height", (d, i) => Math.round(
                            binSizeScaleAllLayers[layer](files[i][selectedClass]['layers'][innerLayerName]['channels'][c]['channel_R_contrib'])))
                        .on('mouseover', function (_, i) {
                            d3.selectAll('.figure-show').attr('filter', 'url(#grayscale-filter)')
                            d3.select('#' + 'input' + '-' + i + '-figure').attr('filter', null)

                            d3.selectAll('.dag-edge-' + innerLayerName + '-' + ch.channel + '-' + i +'-in')
                                .classed('dag-edge-animate-in-' + i, true)
                            d3.selectAll('.dag-edge-' + innerLayerName + '-' + ch.channel + '-' + i + '-out')
                                .classed('dag-edge-animate-out-'+ i, true)

                            d3.select('#' + 'input-' + i + '-figure')
                                .attr('xlink:href', dataURL + 'data/vis/' + allImageNames[0] + '/' + selectedClass + '/HM-' +
                                    imageSuffix[i] + '-' + innerLayerName + '-' +
                                    files[i][selectedClass]['layers'][innerLayerName]['channels'][c].channel + imageExt)

                            d3.select('#' + innerLayerName + '-' + ch.channel + '-figure').attr('filter', null)
                            d3.select('#' + innerLayerName + '-' + ch.channel + '-' + i + '-bin').attr('filter', null)

                            d3.selectAll('.' + 'int' + '-' + i + '-figures').attr('filter', null)
                        })
                        .on('mouseout', mouseOutHighlightAllMode1)
                }

            }

            function drawIntMode1(innerLayerName){
                dagG.append('g')
                    .classed('int-FVs-group', true)
                    .selectAll('.' + innerLayerName + '-figures-temp')
                    .data(allImageNames)
                    .enter()
                    .append('image')
                    .attr('x', 0)
                    .attr('y', 0)
                    .attr('width', imgWidth)
                    .attr('height', imgWidth)
                    .attr('xlink:href', (d, i) => {
                        let filename = dataURL + 'data/vis/' + allImageNames[0] + '/' +
                            selectedClass + '/FV-' + imageSuffix[i] + '-' + layer + imageExt;
                        return filename
                    })
                    .attr('clip-path', (d, i) => 'url(#intfv-clip-path-' + imageSuffix[i] + ')')
                    .attr("transform", (d, i) => "translate(" +
                        files[i][selectedClass].intfvx + ',' +
                        files[i][selectedClass].intfvy + " )"
                    )
                    .attr('class', (d, i) => {
                        return innerLayerName + '-' + i + '-figures' +
                            ' ' + innerLayerName + '-figures' +
                            ' ' + 'figure-show'
                    })
                    .on('mouseover', function (d, i) {
                        // 把连接着下一层的edge都加上动画
                        mouseOverHighlightFigures(d, i, innerLayerName)
                    })
                    .on('mouseout', mouseOutHighlightAllMode1)

                dagG.append('g')
                    .classed('int-HMs-group', true)
                    .selectAll('.' + innerLayerName + '-figures-temp')
                    .data(allImageNames)
                    .enter()
                    .append('image')
                    .attr('x', 0)
                    .attr('y', 0)
                    .attr('width', imgWidth)
                    .attr('height', imgWidth)
                    .attr('xlink:href', (d, i) => {
                        let filename = dataURL + 'data/vis/' + allImageNames[0] + '/' +
                            selectedClass + '/HM-' + imageSuffix[i] + '-' + layer + imageExt;
                        return filename
                    })
                    .attr('clip-path', (d, i) => 'url(#inthm-clip-path-' + imageSuffix[i] + ')')
                    .attr("transform", (d, i) => "translate(" +
                        files[i][selectedClass].inthmx + ',' +
                        files[i][selectedClass].inthmy + " )"
                    )
                    .attr('class', (d, i) => {
                        return innerLayerName + '-' + i + '-figures' +
                            ' ' + innerLayerName + '-figures' +
                            ' ' + 'figure-show'
                    })
                    .on('mouseover', function (d, i) {
                        mouseOverHighlightFigures(d, i, innerLayerName)
                    })
                    .on('mouseout', mouseOutHighlightAllMode1)
            }

            function drawSubMode1(innerLayerName){
                dagG.append('g')
                    .classed('sub-HMs-group', true)
                    .selectAll('.' + innerLayerName + '-figures-temp')
                    .data(imageSuffix.slice(1))
                    .enter()
                    .append('image')
                    .attr('x', 0)
                    .attr('y', 0)
                    .attr('width', imgWidth)
                    .attr('height', imgWidth)
                    .attr('xlink:href', (d, i) => {
                        let filename = dataURL + 'data/vis/' + allImageNames[0] + '/' +
                            selectedClass + '/HMS-' + imageSuffix[i+1] + '-' + layer + imageExt;
                        return filename
                    })
                    .attr('clip-path', (d, i) => 'url(#subhm-clip-path-' + imageSuffix[i+1] + ')')
                    .attr("transform", (d, i) => "translate(" +
                        files[i+1][selectedClass].subhmx + ',' +
                        files[i+1][selectedClass].subhmy + " )"
                    )
                    .attr('class', (d, i) => {
                        return innerLayerName + '-' + (i+1) + '-figures' +
                            ' ' + innerLayerName + '-figures' +
                            ' ' + 'figure-show'
                    })
                    .on('mouseover', function (d, i) {
                        mouseOverHighlightFigures(d, i, innerLayerName)
                    })
                    .on('mouseout', mouseOutHighlightAllMode1)

                dagG.append('g')
                    .classed('sub-icons-group', true)
                    .selectAll('.sub-icon')
                    .data(imageSuffix.slice(1))
                    .enter()
                    .append('image')
                    .attr('x', 0)
                    .attr('y', 0)
                    .attr('width', imgWidth/2)
                    .attr('height', imgWidth/2)
                    .attr('filter', 'url(#transparent-filter)')
                    .attr('xlink:href', dataURL + 'static/remove_circle_outline-black-48dp.svg')
                    .attr('clip-paht', d => 'url(#subicon-clip-path-' + d + ')')
                    .attr("transform", (d, i) => "translate(" +
                        files[i+1][selectedClass].subiconx + ',' +
                        files[i+1][selectedClass].subicony + " )"
                    )
                    .attr('id', (d, i) => innerLayerName + '-icon-' + i)
                    .classed('sub-icon', true)
            }

            function drawEdgesInputImages(layerName, imageNameIndex){
                dagG.append('g')
                    .classed(layerName + '-' + imageNameIndex + '-edges-group', true)
                    .selectAll('.dag-edge-temp-' + layerName + '-' + imageNameIndex + '-out')
                    .data(files[imageNameIndex][selectedClass]['layers'][layer]['channels'])
                    .enter()
                    .append('path')
                    .attr('d', d => {return "M" + (files[imageNameIndex][selectedClass].x+files[imageNameIndex][selectedClass].width/2) +
                        " " + (files[imageNameIndex][selectedClass].y) +
                        "C" + (files[imageNameIndex][selectedClass].x+files[imageNameIndex][selectedClass].width/2) +
                        " " + (files[imageNameIndex][selectedClass].y - layerVerticalSpace / 2) +
                        "," + (d.fvx + d.fvwidth/2) + " " + (files[imageNameIndex][selectedClass].y - layerVerticalSpace / 2) +
                        "," + (d.fvx + d.fvwidth/2) + " " + (d.fvy + d.fvwidth)})
                    .style('stroke-width', d => inputEdgeSizeScaleAllLayers[layer](d.channel_AM_contrib))
                    .attr('class', d => {
                        let classString = 'dag-edge' +
                            ' ' + 'dag-edge-' + imageNameIndex +
                            ' ' + 'dag-edge-' + layerName +
                            ' ' + 'dag-edge-' + layerName + '-' + imageNameIndex + '-out' +
                            ' ' + 'dag-edge-' + layer + '-' + d.channel + '-in' +
                            ' ' + 'dag-edge-' + layer + '-' + d.channel + '-' + imageNameIndex + '-in'
                        return classString
                    })
                    .attr('id', d => {
                        return 'dag-edge-' + layerName + '-' + imageNameIndex + '-' + layer + '-' + d.channel
                    })
                    .on('mouseover', function (d, i) {
                        mouseOverHighlightEdges(d, i, layerName, imageNameIndex)
                    })
                    .on('mouseout', mouseOutHighlightAllMode1)
            }

            function drawEdgesChannelBins(layerName, imageNameIndex){
                const singleBinWidth = files[0][selectedClass]['layers'][layerName]['channels'][0].binwidth / allImageNames.length
                dagG.append('g')
                    .classed(layerName + '-' + imageNameIndex + '-edges-group', true)
                    .selectAll('.dag-edge-temp-' + layerName + '-' + imageNameIndex + '-out')
                    .data(files[imageNameIndex][selectedClass]['layers'][layerName]['channels'])
                    .enter()
                    .append('path')
                    .attr('d', (d, i) => {return "M" + (d.binx+imageNameIndex*singleBinWidth+singleBinWidth/2) +
                        " " + (d.biny+binHeight - binSizeScaleAllLayers[layerName](d['channel_R_contrib'])) +
                        "C" + (d.binx+imageNameIndex*singleBinWidth+singleBinWidth/2) +
                        " " + (d.biny+binHeight - binSizeScaleAllLayers[layerName](d['channel_R_contrib']) +
                            (files[imageNameIndex][selectedClass].intfvy + imgWidth)) / 2 +
                        "," + (files[imageNameIndex][selectedClass].intfvx + imgWidth/2) +
                        " " + (d.biny+binHeight - binSizeScaleAllLayers[layerName](d['channel_R_contrib']) +
                            (files[imageNameIndex][selectedClass].intfvy + imgWidth)) / 2 +
                        "," + (files[imageNameIndex][selectedClass].intfvx + imgWidth/2) +
                        " " + (files[imageNameIndex][selectedClass].intfvy + imgWidth)})
                    .style('stroke-width', d => layerEdgeSizeScaleAllLayers[layerName](d.channel_R_contrib))
                    .attr('class', d => {
                        let classString = 'dag-edge' +
                            ' ' + 'dag-edge-' + imageNameIndex +
                            ' ' + 'dag-edge-' + layerName +
                            ' ' + 'dag-edge-' + layerName + '-' + d.channel + '-out' +
                            ' ' + 'dag-edge-' + layerName + '-' + d.channel + '-' + imageNameIndex + '-out' +
                            ' ' + 'dag-edge-int-' + imageNameIndex + '-in'
                        return classString
                    })
                    .attr('id', d => {
                        return 'dag-edge-' + layerName + '-' + d.channel + '-'
                            + imageNameIndex + '-' + 'in-' + imageNameIndex
                    })
                    .on('mouseover', function (d, i) {
                        mouseOverHighlightEdges(d, i, layerName, imageNameIndex)
                    })
                    .on('mouseout', mouseOutHighlightAllMode1)
            }

            function drawEdgesIntHeatmaps(){
                // 画图第一个int 热力图连接的三条线
                dagG.append('g')
                    .classed('int-edges-group', true)
                    .selectAll('.dag-edge-temp-int-0-out')
                    .data(imageSuffix.slice(1))
                    .enter()
                    .append('path')
                    .attr('d', (d, i) => {return "M" + (files[0][selectedClass].inthmx + imgWidth/2) +
                        " " + (files[0][selectedClass].inthmy) +
                        "C" + (files[0][selectedClass].inthmx + imgWidth/2) +
                        " " + (files[0][selectedClass].inthmy - layerVerticalSpace*0.6*(i+1)) +
                        "," + (files[i+1][selectedClass].subhmx + imgWidth/2) +
                        " " + (files[i+1][selectedClass].subhmy - layerVerticalSpace*0.6*(i+1)) +
                        "," + (files[i+1][selectedClass].subiconx + imgWidth/4) +
                        " " + (files[i+1][selectedClass].subicony)})
                    .style('stroke-width', d => edgeSize/2)
                    .attr('class', (d, i) => {
                        let classString = 'dag-edge' +
                            ' ' + 'dag-edge-0' +
                            ' ' + 'dag-edge-int' +
                            ' ' + 'dag-edge-int-0-out' +
                            ' ' + 'dag-edge-sub-' + (i+1) + '-in'
                        return classString
                    })
                    .attr('id', (d, i) => {
                        return 'dag-edge-int-0-sub-' + (i+1)
                    })
                    .on('mouseover', function (d, i) {
                        mouseOverHighlightEdges(d, i, 'int', 0)
                    })
                    .on('mouseout', mouseOutHighlightAllMode1)

                dagG.append('g')
                    .classed('int-edges-group', true)
                    .selectAll('.dag-edge-temp-int-out')
                    .data(imageSuffix.slice(1))
                    .enter()
                    .append('path')
                    .attr('d', (d, i) => {return "M" + (files[i+1][selectedClass].inthmx + imgWidth/2) +
                        " " + (files[i+1][selectedClass].inthmy) +
                        "C" + (files[i+1][selectedClass].inthmx + imgWidth/2) +
                        " " + (files[i+1][selectedClass].inthmy - layerVerticalSpace) +
                        "," + (files[i+1][selectedClass].subhmx + imgWidth/2) +
                        " " + (files[i+1][selectedClass].subhmy - layerVerticalSpace) +
                        "," + (files[i+1][selectedClass].subiconx + imgWidth/4) +
                        " " + (files[i+1][selectedClass].subicony)})
                    .style('stroke-width', d => edgeSize/2)
                    .attr('class', (d, i) => {
                        let classString = 'dag-edge' +
                            ' ' + 'dag-edge-' + (i+1) +
                            ' ' + 'dag-edge-int' +
                            ' ' + 'dag-edge-int-' + (i+1) + '-out' +
                            ' ' + 'dag-edge-sub-' + (i+1) + '-in'
                        return classString
                    })
                    .attr('id', (d, i) => {
                        return 'dag-edge-int-' + (i+1) + '-sub-' + (i+1)
                    })
                    .on('mouseover', function (d, i) {
                        mouseOverHighlightEdges(d, (i+1), 'int', (i+1))
                    })
                    .on('mouseout', mouseOutHighlightAllMode1)
            }

            function drawEdgesSubicons(){
                dagG.append('g')
                    .classed('subicon-edges-group', true)
                    .selectAll('.dag-edge-temp-subicon-out')
                    .data(imageSuffix.slice(1))
                    .enter()
                    .append('path')
                    .attr('d', (d, i) => {return "M" + (files[i+1][selectedClass].subiconx + imgWidth/4) +
                        " " + (files[i+1][selectedClass].subicony + imgWidth/2) +
                        "v" + (layerVerticalSpace/2 - imgWidth/2)})
                    .style('stroke-width', d => edgeSize/2)
                    .attr('class', (d, i) => {
                        let classString = 'dag-edge' +
                            ' ' + 'dag-edge-0' +
                            ' ' + 'dag-edge-' + (i+1) +
                            ' ' + 'dag-edge-subicon' +
                            ' ' + 'dag-edge-subicon-' + (i+1) + '-out' +
                            ' ' + 'dag-edge-sub-' + (i+1) + '-in'
                        return classString
                    })
                    .attr('id', (d, i) => {
                        return 'dag-edge-subicon-' + (i+1) + '-sub-' + (i+1)
                    })
                    .on('mouseover', function (d, i) {
                        // 把全部都变灰
                        d3.selectAll('.img-show').attr('filter', 'url(#grayscale-filter)')
                        d3.selectAll('.' +  'int' + '-' + 0 + '-figures').attr('filter', null)
                        d3.selectAll('.' +  'int' + '-' + (i+1) + '-figures').attr('filter', null)
                        d3.selectAll('.' +  'sub' + '-' + (i+1) + '-figures').attr('filter', null)
                        d3.selectAll('.dag-edge-' + 'sub' + '-' + 0 + '-in')
                            .classed('dag-edge-animate-in-'+0, true)
                    })
                    .on('mouseout', mouseOutHighlightAllMode1)
            }

            function writeLabelsAllLayers(){
                dagG.selectAll('.dag-input-image-label')
                    .data(underImageLabels)
                    .enter()
                    .append('text')
                    .attr('x', (d, i) => files[i][selectedClass].x + imgWidth/2)
                    .attr('y', (d, i) => files[i][selectedClass].y + imgHeight + imgWidth/6)
                    .text(d => d)
                    // .attr('transform', (d, i) =>
                    //     'translate(' + (files[i][selectedClass].x) +
                    //     ',' +
                    //     (files[i][selectedClass].y + imgHeight + imgWidth/3) + ')')
                    .attr('text-anchor', 'middle')
                    .classed('fv-ch-label', true)

                dagG.selectAll('.dag-input-image-label')
                    .data(underImageLabels)
                    .enter()
                    .append('text')
                    .attr('x', (d, i) => files[i][selectedClass].x + imgWidth/2)
                    .attr('y', (d, i) => files[i][selectedClass].y + imgHeight + imgWidth/2.5)
                    .text((d, i) => 'score: ' + formatFixedPoint(files[i][selectedClass]['pred_score']))
                    // .attr('transform', (d, i) =>
                    //     'translate(' + (files[i][selectedClass].x) +
                    //     ',' +
                    //     (files[i][selectedClass].y + imgHeight + imgWidth/3) + ')')
                    .attr('text-anchor', 'middle')
                    .classed('fv-ch-label', true)

                dagG.selectAll('.dag-channel-label')
                    .data(files[0][selectedClass]['layers'][layer]['channels'])
                    .enter()
                    .append('text')
                    .text(d => d.channel)
                    .attr('transform', (d, i) =>
                        'translate(' + (d.fvx) +
                        ',' +
                        (d.fvy + fvHeight + fvHeight/6) + ')')
                    .attr('text-anchor', 'start')
                    .classed('fv-ch-label', true)
                    .attr('id', d => 'dag-label-' + layerLabels[1] + '-' + d.channel)

                layerLabels.forEach((layerLabel, layerLabelIndex) => {
                    if(layerLabelIndex === 0){
                        dagG.append('text')
                            .text(toTitleCase(layerLabel))
                            .attr('transform', 'translate(' + (files[0][selectedClass].x - imgHorizontalSpace/6) +
                                ',' +
                                (files[0][selectedClass].y + imgHeight/2) + ')')
                            .attr('text-anchor', 'end')
                            .classed('dag-label', true)
                    }
                    else if(layerLabelIndex === 1){
                        dagG.append('text')
                            .text(toTitleCase(layerLabel))
                            .attr('transform', 'translate(' + (files[0][selectedClass]['layers'][layer]['channels'][0].fvx - imgHorizontalSpace/6) +
                                ',' +
                                (files[0][selectedClass]['layers'][layer]['channels'][0].fvy + fvHeight/2) + ')')
                            .attr('text-anchor', 'end')
                            .classed('dag-label', true)
                    }
                    else if(layerLabelIndex === 2){
                        dagG.append('text')
                            .text(toTitleCase(layerLabel))
                            .attr('transform', 'translate(' + (files[0][selectedClass].intfvx - imgHorizontalSpace/6) +
                                ',' +
                                (files[0][selectedClass].intfvy) + ')')
                            .attr('text-anchor', 'end')
                            .classed('dag-label', true)
                    }
                })
            }

            function drawDAG() {
                // 画出图像,因为图像部分与其他无关,可以保持不变
                computeImageCoordinates();
                for (let i=0; i<allImageNum; i++) {
                    newImageClipPath(i)
                }
                drawImagesMode1(modeLayers[0])

                // 画出特征可视化图像
                computeFvCoordinatesMode1();
                files[0][selectedClass]['layers'][layer]['channels'].forEach((ch, i) => {
                    newFvClipPathMode1(ch)
                })
                drawFvChannelsMode1(modeLayers[1]);

                // 画出特征可视化图上方的attr柱状图
                computeAttrBinCoordinatesMode1();
                files[0][selectedClass]['layers'][layer]['channels'].forEach((ch, i) => {
                    newBinClipPathMode1(ch)
                })
                drawAttrBinsMode1(modeLayers[1]);

                // 画出整合图
                computeIntCoordinatesMode1();
                for (let i=0; i<allImageNum; i++) {
                    newIntClipPathMode1(i)
                }
                drawIntMode1(modeLayers[2]);

                // 画出sub图
                computeSubCoordinatesMode1();
                for (let i=1; i<allImageNum; i++) {
                    newSubClipPathMode1(i)
                }
                drawSubMode1(modeLayers[3]);

                // 函数命名规则为首先是edge,然后edge起始层名和具体内容名
                for (let i=0; i<allImageNum; i++) {
                    // 画连接输入图像的曲线
                    drawEdgesInputImages('input', i)
                    // 画连接这归因值柱状图的曲线
                    drawEdgesChannelBins(layer, i)
                }
                // 画出连接整合热力图的曲线
                drawEdgesIntHeatmaps()
                // 画出连接sub icon的曲线
                drawEdgesSubicons()

                // 根据每层的位置,逐一写上label
                writeLabelsAllLayers()

                d3.select('#dag-channel-count-filter-slider')
                    .on('input', function () {

                        let filterValue = this.value
                        filterFilterValue =filterValue

                        d3.selectAll('.fv-ch')
                            .attr('display', d => {

                                    if (d.count > filterValue) {
                                        channelsHidden.delete(d.layer + '-' + d.channel)

                                        d3.select('#fv-ch-label-' + d.layer + '-' + d.channel)
                                            .attr('display', 'block')

                                        return 'block'
                                    } else {
                                        channelsHidden.add(d.layer + '-' + d.channel)

                                        d3.select('#fv-ch-label-' + d.layer + '-' + d.channel)
                                            .attr('display', 'none')

                                        return 'none'
                                    }
                                }
                            )

                        // move fv and edges on filter change
                        layers.forEach(l => {
                            computeChannelCoordinatesFilter(l, filterValue, 'filter')
                        });

                        // Update visibility of edges
                        d3.selectAll('.dag-edge').attr('display', 'block')
                        channelsHidden.forEach(ch => {
                            d3.selectAll('.dag-edge-' + ch)
                                .attr('display', 'none')
                        })

                        updateChannels()
                        updateChannelLabels()
                        updateLayerLabels(filterValue)
                        updateEdges()
                        updateDatasetExamples()
                        // updateAttrChannels()
                        // updateAttrLabels()
                        // updateAttrExRect()

                    })
                    .property('value', 0)

                d3.select('#dag-width-filter-slider')
                    .on('input', function () {
                        let filterValue = parseInt(this.value)

                        fvHorizontalSpace = filterValue

                        // move fv and edges on filter change
                        layers.forEach(l => {
                            computeChannelCoordinatesFilter(l, filterValue, 'width')
                        });

                        updateChannels()
                        updateChannelLabels()
                        updateLayerLabels(filterFilterValue)
                        updateEdges()
                        updateDatasetExamples()
                        // updateAttrChannels()
                        // updateAttrLabels()
                        // updateAttrExRect()

                    })

                d3.select('#dag-height-filter-slider')
                    .on('input', function () {

                        let filterValue = this.value
                        layerVerticalSpace = parseInt(filterValue)

                        // move fv and edges on filter change
                        layers.forEach(l => {
                            computeChannelCoordinatesFilter(l, filterValue, 'height')
                        });

                        updateChannels()
                        updateChannelLabels()
                        updateLayerLabels(filterFilterValue)
                        updateEdges()
                        updateDatasetExamples()
                        // updateAttrChannels()
                        // updateAttrLabels()
                        // updateAttrExRect()

                    })

            }

            drawDAG()

        }
    })

}

export function removeDagVIS() {
    // console.log('removed')
    d3.select("#dagG").remove()
    d3.selectAll("#dag defs > clipPath").remove()
}
