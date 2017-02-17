# Find Ghost

## Dependency 依赖包
[js.cookie 2.1.3](https://github.com/js-cookie/js-cookie/releases/tag/v2.1.3)

[jquery 1.11.1](https://github.com/jquery/jquery/releases/tag/1.11.1)

[bootstrap 3.3.0](https://github.com/twbs/bootstrap/releases/tag/v3.3.0)

[Mersenne Twister](http://www.math.sci.hiroshima-u.ac.jp/~m-mat/MT/VERSIONS/JAVASCRIPT/java-script.html)

## 游戏介绍
通过发言来判断阵营，设法让对方出局的游戏

## 身份
### 法官
负责出词，要求两个词意思相近字数相等
### 小白
从玩家发言中判断出人词是什么
### 玩家
#### 人
拿到人词的玩家，为多数方
#### 鬼
拿到鬼词的玩家，为少数方
## 游戏进程
### 准备
法官想好一对词语并发给玩家，词语多数的一方为人，发到词语少数一方为鬼。

双方都不知道自己的身份和对方的词语。
### 发言
法官指定一个人开始发言，发言者通常发表与自己词语相关特性的话，但不得提到自己词语里包含的字（法官特别指出的常用字不在此列）发言一般第一回合两轮，第二回合起每回合一轮。

玩家人数小于五人时，第一回合发言三轮。
### 投票
发言完毕以后投票。

高票者出局，如平票则进入pk。

PK平票则一起出局。投票完，则开始下一轮发言，直到一方满足胜利条件。

## 胜利条件
### 人胜利条件
所有鬼出局
### 鬼胜利条件
鬼的人数不少于人
### 小白胜利条件
小白在游戏没有结束前的任何时候猜中人词
