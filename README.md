# enncryption-loader

> 一个简单的用于加密的工具 还在完善当中 可以下载学习,请勿用于项目中

## 使用方法(use)

First, install `enncryption-loader` as a development dependency:

```shell
npm install --save-dev enncryption-loader
```

Then, add it to your `webpack.config.js`:

```javascript
{    
    rules: [{
        test: /\.js$/,
            use: {
            loader:'enncryption-loader'
        }]
}
```