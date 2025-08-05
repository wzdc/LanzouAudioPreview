// ==UserScript==
// @name         蓝奏云音频预览
// @namespace    https://github.com/wzdc/LanzouAudioPreview
// @version      0.2
// @description  在线预览蓝奏云文件夹内音频文件
// @author       wzdc
// @icon         https://lanzoui.com/images/type/mp3.gif
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
// @downloadURL  https://raw.githubusercontent.com/wzdc/LanzouAudioPreview/refs/heads/main/LanzouAudioPreview.user.js
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const apaudio = {
        artist: document.title, // 歌手
        album: "", // 专辑
        cover: "", // 封面
        type: "normal", // 音频类型
        url: "", // 音频 URL
        lrc: "[00:00:00] ", // 歌词
        metadata: false, // metadata已获取
    }
    
    const parser = new DOMParser();

    // 保存原始的 XMLHttpRequest
    const originalXhrSend = XMLHttpRequest.prototype.send;

    // 重写 XMLHttpRequest 的 send 方法
    XMLHttpRequest.prototype.send = function(data) {
        // 监听 filemoreajax.php 的响应
        this.addEventListener('load', function() {
            if (this.responseURL.includes('filemoreajax.php') && this.status === 200) {
                var data = JSON.parse(this.responseText);
                // 获取音乐列表
                if(data.zt == 1) {
                    var musiclist = [];
                    data.text.forEach(function(song, index) {
                        if(song.t == 0 && song.id != -1  && (song.icon == "mp3" || song.icon == "flac")) {
                            musiclist.push({
                                id: window.location.origin + "/" + song.id, // ID
                                name: parser.parseFromString(song.name_all, "text/html").documentElement.textContent, // 音乐标题
                                ...apaudio,
                            });
                        }
                    });
                    if(musiclist.length !== 0) {
                        musicplayer(musiclist);
                    }
                }
            }
        });

        // 调用原始的 send 方法
        return originalXhrSend.apply(this, arguments);
    };

    // 通过DOM获取文件列表
    function DOMGetFileList() {
        var musiclist = [];
        const regexname = /\.(mp3|flac)$/i; // 匹配文件扩展名
        const regexcon = /\/(mp3|flac)\.gif$/i; // 匹配文件图标
        let infos = document.getElementById('infos'); // 获取 ID 为 infos 的元素
        let links = infos.getElementsByTagName('a'); // 获取 infos 中所有的 <a> 标签
        if(links.length == 0) return;
        for(let i = 0; i < links.length; i++) { // 遍历每个 <a> 标签
            let link = links[i];
            let img = link.querySelector('img'); // 查找第一个 img
            let textContent = ''; // 提取文本内容，忽略子元素
            for(let node of link.childNodes) {
                if(node.nodeType === Node.TEXT_NODE) { // 只获取文本节点
                    textContent += node.textContent;
                }
            }
            if(regexname.test(textContent) || img && regexcon.test(img.getAttribute('src'))) {
                musiclist.push({
                    id: link.href, // 分享链接
                    name: textContent, // 音乐标题
                    ...apaudio,
                });
            }
        }
        if(musiclist.length !== 0) {
            musicplayer(musiclist);
        }
    }

    if(typeof pgs === 'undefined' || document.getElementById("sub") !== null) { // 早于网页加载（或有密码）
    } else if(document.getElementById("load2").style.display == "none") { // 已经加载完成
        DOMGetFileList();
    } else { // 未完成加载
        const observer = new MutationObserver((mutationsList, observer) => {
            DOMGetFileList();
            observer.disconnect();
        });

        observer.observe(document.getElementById('infos'), {
            childList: true,
            characterData: true,
            subtree: true
        });
    }
})();

// 播放音乐
function musicplayer(musiclist) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/aplayer@1.10.1/dist/APlayer.min.css'; // Aplayer CSS
    link.type = 'text/css';
    document.head.appendChild(link);
    const script2 = document.createElement('script');
    script2.src = 'https://cdnjs.cloudflare.com/ajax/libs/jsmediatags/3.9.5/jsmediatags.min.js'; // jsmediatags JavaScript
    script2.type = 'text/javascript';
    document.head.appendChild(script2);
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/aplayer@1.10.1/dist/APlayer.min.js'; // Aplayer JavaScript
    script.type = 'text/javascript';
    script.onload = function() {

        (function() { // 播放失败时重试
            const APlayer = window.APlayer;
            const originalOn = APlayer.prototype.on;
            APlayer.prototype.on = function(event, handler) {
                if(event === "error") {
                    const wrappedHandler = (...args) => {
                        PlayAudio().then(result => {
                            if (!result) handler.apply(this, args);
                        });
                    };
                    return originalOn.call(this, event, wrappedHandler);
                }
                return originalOn.call(this, event, handler);
            };
        })();
        
        ap = new APlayer({ // 创建 APlayer 播放器
            element: document.getElementById('aplayer'),
            narrow: false, // 是否缩小播放器
            autoplay: false, // 自动播放
            fixed: (window.top === window.self), // 吸底模式
            theme: '#b7daff', // 自定义播放器主题颜色
            mode: 'circulation', // 循环播放
            preload: 'none', // 不预加载
            lrcType: 1, // 加载歌词
            volume: 1, // 默认音量
            audio: musiclist
        });
        
        (function() { // lrc.js:78 Uncaught TypeError: Cannot read properties of undefined 补丁
            const _switch = ap.lrc.switch
            const _update = ap.lrc.update
            ap.lrc.switch = (index) => {
                ap.lrc.update = () => {}
                _switch.call(ap.lrc, index)
               ap.lrc.update = _update
            }
        })();

        // 设置 Media Session
        if ("mediaSession" in navigator) {
            navigator.mediaSession.setActionHandler('previoustrack', function() {
                ap.skipBack(); // 切换到上一曲
            });

            navigator.mediaSession.setActionHandler('nexttrack', function() {
                ap.skipForward(); // 切换到下一曲
            });

            navigator.mediaSession.setActionHandler('seekbackward', function() {
                ap.audio.currentTime = Math.max(ap.audio.currentTime - 10, 0); // 快退10秒
            });

            navigator.mediaSession.setActionHandler('seekforward', function() {
                ap.audio.currentTime = Math.min(ap.audio.currentTime + 10, ap.audio.duration); // 快进10秒
            });

            SetMediaSession = function(data) {
                navigator.mediaSession.metadata = new MediaMetadata({
                    title: data.name,
                    artist: data.artist,
                    album: data.album,
                    artwork: data.cover ? [{ src: data.cover }] : [],
                });
            }

            SetMediaSession(musiclist[0]);
        } else {
            SetMediaSession = function(data) {};  // 不支持 Media Session
        }

         // 设置当前播放音频的元数据
        ap.on('listswitch', function(info) {
            SetMediaSession(ap.list.audios[info.index]);
            setAudioMetadata(info.index);

            // 加载新歌曲
            if(document.getElementById("filemore").style.display != "none" && info.index === ap.list.audios.length - 1) {
                more();
            }
        });
    }
    document.head.appendChild(script);
    const div = document.createElement('div');
    div.id = 'aplayer';
    const body = document.body;
    body.insertBefore(div, body.firstChild);
    musicplayer = function(musiclist) {
        ap.list.add(musiclist);
    };
}

// 获取播放链接并播放
async function PlayAudio() {
    const currentIndex = ap.list.index;
    const data = ap.list.audios[currentIndex];

    try {
        const res = await fetch('https://lz.qaiu.top/json/parser?url=' + encodeURIComponent(data.id), { // 你的服务器地址
            method: 'GET',
            /*headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: 'url=' + encodeURIComponent(data.id) // POST 请求参数*/
        });
        const response = await res.json();
        if(response.code != 200) return false; // 成功状态码
        data.url = response.data.directLink; // URL
    } catch (e) {
        console.error(e);
        return (ap.list.index != currentIndex);
    }

    if(ap.list.index == currentIndex) {
        ap.list.audios[ap.list.index].url = data.url;
        ap.setAudio({ type: "normal", url: data.url });
        setAudioMetadata(currentIndex).then(); // 设置当前播放音频的元数据
    }
    return true;
}

// 获取 Metadata 并设置
async function setAudioMetadata(currentIndex) {
    if(ap.list.audios[currentIndex].metadata || !ap.list.audios[currentIndex].url) {
        return;
    }
    ap.list.audios[currentIndex].metadata = true;
    jsmediatags.read(ap.list.audios[currentIndex].url, {
        onSuccess: function(tag) {
            const tags = tag.tags;
            const lyrics = tags.lyrics?.lyrics || tags.uslt?.text || "";

            if(tags.title) {
                ap.list.audios[currentIndex].name = tags.title;
                if(ap.list.index == currentIndex) ap.template.title.innerHTML = tags.title;
            }

            if(tags.artist) {
                ap.list.audios[currentIndex].artist = tags.artist;
                if(ap.list.index == currentIndex) ap.template.author.innerHTML = " - " + ap.list.audios[currentIndex].artist;
            }

            if(tags.album) {
                ap.list.audios[currentIndex].album = tags.album;
            }

            if(tags.picture) {
                const {data,format} = tags.picture;
                let base64 = '';
                for(let i = 0; i < data.length; i++) {
                    base64 += String.fromCharCode(data[i]);
                }
                let cover = `data:${format};base64,${btoa(base64)}`;
                ap.list.audios[currentIndex].cover = cover;
                if(ap.list.index == currentIndex) ap.template.pic.style.backgroundImage = 'url("' + cover + '")';
            }

            if(lyrics) {
                ap.list.audios[currentIndex].lrc = lyrics;
                ap.lrc.parsed[currentIndex] = ap.lrc.parse(lyrics);
                if(ap.list.index == currentIndex) ap.lrc.switch(currentIndex);
            }

            if((tags.title || tags.artist || tags.picture || tags.album) && ap.list.index == currentIndex) {
                SetMediaSession(ap.list.audios[currentIndex]);
            }
        },
        onError: function(error) {
            ap.list.audios[currentIndex].metadata = false;
            console.error(error);
        }
    });
}
