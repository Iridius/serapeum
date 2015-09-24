const _SEPARATOR = '|';
const config = _getData('http://localhost:63342/Serapeum/data/config.json');

function displayData(id, data_url, display, fieldList) {
    var data = _getData(data_url);
    var result = _formatData(data, display, fieldList);

    var element = document.getElementById(id);
    element.innerHTML += result;
}

function _getData(url) {
    var request = new XMLHttpRequest();
    request.open('GET', url, false);
    request.send(null);

    if(request.readyState == 4 && request.status == 200) {
        return JSON.parse(request.responseText);
    }

    return null;
}

function _formatData(data, display, fieldList) {
    switch (display) {
        case 'article':
            return _getContent(data)
            break;
        case 'epigraph':
        case 'quote':
            return _getQuote(data);
            break;
        case 'glossary':
            return _getGlossary(data, fieldList);
            break;
        case 'list':
            return _getEntitledList(data, fieldList);
            break;
        case 'table':
            return _getTable(data, fieldList);
            break;
        default: // read control type from config
            if(!Array.isArray(data)){
                return '';
            }

            var result = '';
            data.forEach(function(item){
                if(item.hasOwnProperty("type")){
                    var type = item.type;
                    result += _formatData(item, type);
                }
            });

            return result;
    }

    return '';
}

function _getHeader(data){
    if(data.hasOwnProperty("header")){
        return _format('header', data.header);
    }

    return '';
}

function _getList(data, _LIST, _ITEM, fieldList){
    var result = '';

    if(data.hasOwnProperty('content') && Array.isArray(data.content)){
        var list = '';
        data.content.forEach(function(item){
            list += _ITEM.replace('{item}', _getContent(item, fieldList));
        });

        result += _LIST.replace('{list}', list);
    }

    return result;
}

function _getGlossary(data, fieldList){
    var result = '';

    result += _getHeader(data);
    result += _getList(data, "<\dl\>{list}\</dl\>", "\<dd\>{item}\</dd\>", fieldList);

    return result;
}

function _getQuote(data) {
    var result = '';

    result += _getHeader(data);

    if(data.hasOwnProperty('content')){
        var content = data.content;

        if(Array.isArray(content)){
            content.forEach(function(quote){
                result += _getQuoteContent(quote);
            });
        } else {
            result += _getQuoteContent(content);
        }
    }

    return result;
}

function _getQuoteContent(content){
    var source = '';
    if(content.hasOwnProperty('source')){
        source = _format("source", content.source);
    }

    if(content.hasOwnProperty('quote')){
        return _format('quote', content.quote + source);
    }

    return '';
}

function _getTable(data) {
    var result = '';

    result += _getHeader(data);

    const _TABLE = '\<table\>{table}\</table\>';
    const _ROW = '\<tr\>{row}\</tr\>';
    const _CELL = '\<td\>{cell}\</td\>';
    if(data.hasOwnProperty('content')){

        var row_value = '';
        data.content.forEach(function(row){

            var cell_value = '';
            Object.keys(row).forEach(function(cell){
                cell_value += _CELL.replace('{cell}', row[cell]);
            });

            row_value += _ROW.replace('{row}', cell_value);
        });

        result += _TABLE.replace('{table}', row_value);
    }

    return result;
}

//TODO: sorting headers +sorting content
function _getEntitledList(data, fieldList) {
    var result = '';

    result += _getHeader(data);
    result += _getList(data, '<\ol\>{list}\</ol\>', "\<li\>{item}\</li\>", fieldList);

    return result;
}

function _format(field, value) {
    var formatting = _getChildMembers(config, "property", field)[0];

    if(typeof formatting === "undefined" || value.length === 0){
        return value;
    }

    if(formatting.hasOwnProperty("tag")){
        value = "\<" + formatting["tag"] + "\>" + value + "\</" + formatting["tag"] + "\>";
    }
    if(formatting.hasOwnProperty("format")){
        value = formatting["format"].replace("{" + field + "}", value);
    }

    return value;
}

function _getContent(content, fieldList) {
    var fields = fieldList != undefined? fieldList.split(_SEPARATOR): Object.keys(content);

    var result = "";

    for(var i=0; i < fields.length; i++){
        var field = fields[i];
        var value = "";

        if(field === 'src' || field === 'group' || field === 'type'){
            continue;
        }
        if(field === 'title'){
            if(content.hasOwnProperty('title')){
                value = content.title;
            }
            if(content.hasOwnProperty('src')){
                value = '\<a href="' + content.src + '" \>' + value + '\</a\>';
            }
        } else{
            if(content.hasOwnProperty(field)){
                value = content[field];
            }
        }

        result += _format(field, value);
    }

    result = result.trim();
    if(result.lastIndexOf(',') === result.length - 1){
        result = result.substring(0, result.length - 1);
    }

    return result;
}

function _getChildMembers(data, column, value){
    var result = [];
    for(var i=0; i<data.length; i++){
        if(data[i][column] === value){
            result.push(data[i]);
        }
    }
    return result;
}
