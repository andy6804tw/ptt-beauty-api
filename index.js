const request = require('request');
const cheerio = require('cheerio');
const async = require('async');
const express = require('express');

const app = express();

const getTopPages = () => {
  return new Promise((resolve) => {
    request('https://www.ptt.cc/bbs/Beauty/index.html', (err, res, body) => {
      const $ = cheerio.load(body);
      const prev = $('.btn-group-paging a').eq(1).attr('href').match(/\d+/)[0];
      // callback(['', prev, prev - 1]);
      resolve(['', prev, prev - 1]);
    });
  });
};

const getPosts = (page) => {
  return new Promise((resolve) => {
    request(`https://www.ptt.cc/bbs/Beauty/index${page}.html`, (err, res, body) => {
      const $ = cheerio.load(body);
      const posts = $('.r-ent a').map((index, obj) => {
        return $(obj).attr('href');
      }).get();

      // 最後五篇文章圖片不抓
      // 方法一
      const result = posts.slice(0, posts.length - 5);
      // 方法二
      // const posts = [];
      // for (let i = 0; i < $('.r-ent a').length - 5; i++) {
      //   console.log(i);
      //   posts.push($('.r-ent a').eq(i).attr('href'));
      // }
      // callback(result);
      resolve(result);
    });
  });
};

/**
 *
 * @param {*} post
 * @param {*} callback
 */
const getImages = (post) => {
  return new Promise((resolve) => {
    request(`https://www.ptt.cc${post}`, (err, res, body) => {
      let images = body.match(/imgur.com\/[0-9a-zA-Z]{7}/g);
      images = [...new Set(images)];
      resolve(images);
    });
  });
};


app.get('/', (req, res) => {
  // pages 為前三頁頁碼 陣列型態 ex: [ '', '2432', 2431 ]
  getTopPages().then((pages) => {
    async.map(pages, (page, callback) => {
      // 使用 async.map 分別撈出每頁文章的網址
      getPosts(page).then((posts) => {
        callback(null, posts);
      });
    }, (err, results) => {
      // results格式為 [ ['',''], ['',''], ['',''] ]
      // posts 巢狀轉為一維陣列
      const posts = [].concat(...results);
      async.map(posts, (post, callback) => {
        getImages(post).then((images) => {
          callback(null, images);
        });
      }, (err, results) => {
        console.log(results);
        const images = [].concat(...results).map((image) => {
          return `https://${image}.jpg`;
        });
        res.json(images);
      });
    });
  });
}).listen(3000);
