// ==UserScript==
// @name         蓝奏云音频预览
// @namespace    https://github.com/wzdc/LanzouAudioPreview
// @version      0.1
// @description  在线预览蓝奏云文件夹内音频文件
// @author       wzdc
// @match        https://*.lanzoux.com/*
// @match        https://*.lanzoui.com/*
// @match        https://*.lanzouw.com/*
// @match        https://*.lanzouo.com/*
// @match        https://*.lanzouq.com/*
// @match        https://*.lanzouj.com/*
// @match        https://*.lanzouv.com/*
// @match        https://*.lanzoug.com/*
// @match        https://*.lanzoul.com/*
// @match        https://*.lanzouy.com/*
// @match        https://*.lanzout.com/*
// @match        https://*.lanzoup.com/*
// @match        https://*.lanzoub.com/*
// @match        https://*.lanzouf.com/*
// @match        https://*.lanzoum.com/*
// @match        https://*.lanzouh.com/*
// @match        https://*.lanzouu.com/*
// @match        https://*.lanzouk.com/*
// @match        https://*.lanzouc.com/*
// @match        https://*.lanzoue.com/*
// @match        https://*.lanzov.com/*
// @match        https://*.lanzn.com/*
// @match        https://*.lanpv.com/*
// @match        https://*.lanpw.com/*
// @match        https://*.lanzb.com/*
// @match        https://*.lanwp.com/*
// @updateURL    https://raw.githubusercontent.com/wzdc/LanzouAudioPreview/refs/heads/main/LanzouAudioPreview.user.js
// @run-at       document-start
// @grant        none
// ==/UserScript==

const regex = /\.(mp3|flac)$/i; // 匹配文件扩展名

(function() {
    'use strict';

    // 保存原始的 XMLHttpRequest
    const originalXhrOpen = XMLHttpRequest.prototype.open;
    const originalXhrSend = XMLHttpRequest.prototype.send;

    // 重写 XMLHttpRequest 的 open 方法
    XMLHttpRequest.prototype.open = function(method, url) {
        // 监听 filemoreajax.php 的请求
        //if (url.includes('filemoreajax.php')) {
        //    console.log('请求 filemoreajax.php：', url);
        //}

        // 调用原始的 open 方法
        return originalXhrOpen.apply(this, arguments);
    };

    // 重写 XMLHttpRequest 的 send 方法
    XMLHttpRequest.prototype.send = function(data) {
        // 监听 filemoreajax.php 的响应
        this.addEventListener('load', function() {
            if (this.responseURL.includes('filemoreajax.php') && this.status === 200) {
                var data = JSON.parse(this.responseText);
                if(data.zt == 1) {
                    getmusiclist(data.text);
                }
            } /*else if (this.responseURL.includes('ajaxm.php') && this.status === 200) {
                var data = JSON.parse(this.responseText);
                if(data.zt == 1) {
                    var ifr2 = window.top.document.querySelector('.ifr2')
                    ifr2.className = '';
                    ifr2.style.cssText = 'width: 100%;overflow-x: auto;';
                    musicplayer({
                        name: "music", // 音乐标题
                        author: window.top.document.querySelector('font').innerHTML, // 音乐作者
                        url: data.dom+"/file/"+ data.url, // 音频文件 URL
                        pic: "", // 音乐封面图片 URL
                    })
                }
            }*/
        });

        // 调用原始的 send 方法
        return originalXhrSend.apply(this, arguments);
    };
})();

// 初始化播放器
function musicplayer(musiclist) {
    if (typeof ap === 'undefined') {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdn.jsdelivr.net/npm/aplayer@1.10.0/dist/APlayer.min.css';  // 外部 CSS 文件 URL
        link.type = 'text/css';
        document.head.appendChild(link);
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/aplayer@1.10.0/dist/APlayer.min.js';  // 外部 JavaScript 文件 URL
        script.type = 'text/javascript';
        script.onload = function() {
            ap = new APlayer({ // 创建 APlayer 播放器
                element: document.getElementById('aplayer'),
                narrow: false, // 是否缩小播放器
                autoplay: false, // 自动播放
                fixed: (window.top === window.self), // 吸底模式
                theme: '#b7daff', // 自定义播放器主题颜色
                mode: 'circulation', // 循环播放
                preload: 'none', // 不预加载
                audio: musiclist
            });

            // 设置 Media Session
            if (typeof navigator.mediaSession !== 'undefined') {
                navigator.mediaSession.setActionHandler('previoustrack', function() {
                    ap.skipBack(); // 切换到上一曲
                });

                navigator.mediaSession.setActionHandler('nexttrack', function() {
                    ap.skipForward(); // 切换到下一曲
                });


                ap.on('canplay', function () {
                    const currentIndex = ap.list.index;
                    const totalSongs = ap.list.player.list.audios.length;

                    // 加载新歌曲
                    if (document.getElementById("filemore").style.display != "none" && currentIndex === totalSongs - 1) {
                        more();
                    }

                    // 设置当前播放音频的元数据
                    navigator.mediaSession.metadata = new MediaMetadata({
                        title: ap.list.player.list.audios[currentIndex].name,
                        artist: ap.list.player.list.audios[currentIndex].artist,
                        album: "",
                        artwork: []
                    });
                });
            } else {
                ap.on('canplay', function () {
                    const currentIndex = ap.list.index;
                    const totalSongs = ap.list.player.list.audios.length;

                    // 加载新歌曲
                    if (document.getElementById("filemore").style.display != "none" && currentIndex === totalSongs - 1) {
                        more();
                    }
                });
            }
        }
        document.head.appendChild(script);
        const div = document.createElement('div');
        div.id = 'aplayer';
        const body = document.body;
        body.insertBefore(div, body.firstChild);
    } else {
        ap.list.add(musiclist);
    }
}

// 获取音乐列表
function getmusiclist(data) {
    var musiclist = [];
    data.forEach(function(song, index) {
        if(song.t == 0 && song.id != -1  && regex.test(song.name_all)) {
            musiclist.push({
                name: song.name_all, // 音乐标题
                author: document.title, // 音乐作者
                url: "https://lz.qaiu.top/lz/"+song.id, // 音频文件 URL
                pic: "", // 音乐封面图片 URL
            });
        }
    });
    if(musiclist.length !== 0) {
        musicplayer(musiclist);
    }
}
