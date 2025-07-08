// 支持的资源类型（子类），对应的url，类型，查询字段列表，查询字段类型：text，select，name，label，data
export const resourceTypes = {
    "image": {
        "label": "图片",
        "url": "image",
        "type": "image",
        "searchFields": [
            { "name": "name", "type": "text","label": "名称","default": "" },
            {"name":"uploader","type":"text","label":"上传人","default":""},
            { "name": "tag", "type": "select","label": "标签","data": [
                { "label": "全部", "value": "" },
            ] },
        ],
    },
    "background": {
        "label": "背景",
        "url": "backgrounds",
        "type": "image",
        "searchFields": [
            { "name": "name", "type": "text","label": "名称","default": "" },
            { "name": "tag", "type": "select","label": "标签","data": [
                { "label": "全部", "value": "" },
            ] },
        ],
    },
    "video": {
        "label": "视频",
        "url": "video",
        "type": "video",
        "searchFields": [
            { "name": "name", "type": "text","label": "名称","default": "" },
            { "name": "tag", "type": "select","label": "标签","data": [
                { "label": "全部", "value": "" },
            ] },
        ],
    },
    "audio": {
        "label": "音频",
        "url": "voice",
        "type": "audio",
        "searchFields": [
            { "name": "name", "type": "text","label": "名称","default": "" },
            { "name": "tag", "type": "select","label": "标签","data": [
                { "label": "全部", "value": "" },
            ] },
        ],
    },
};