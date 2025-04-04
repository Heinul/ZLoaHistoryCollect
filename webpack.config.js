const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const Dotenv = require('dotenv-webpack');
const { DefinePlugin } = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  mode: 'development',
  devtool: 'source-map',
  entry: {
    content: './src/content.js',
    background: './src/background.js',
    popup: './src/popup.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },
  plugins: [
    new Dotenv({
      path: './.env',
      systemvars: true
    }),
    new CopyWebpackPlugin({
      patterns: [
        { 
          from: 'manifest.json', 
          to: 'manifest.json',
          transform: (content) => {
            const manifest = JSON.parse(content.toString('utf-8'));
            // fetch 권한 제거
            manifest.permissions = manifest.permissions.filter(perm => perm !== 'fetch');
            
            // SVG 아이콘을 PNG로 교체
            if (manifest.icons) {
              Object.keys(manifest.icons).forEach(size => {
                if (manifest.icons[size].endsWith('.svg')) {
                  manifest.icons[size] = manifest.icons[size].replace('.svg', '.png');
                }
              });
            }
            
            // default_icon도 SVG에서 PNG로 교체
            if (manifest.action && manifest.action.default_icon) {
              Object.keys(manifest.action.default_icon).forEach(size => {
                if (manifest.action.default_icon[size].endsWith('.svg')) {
                  manifest.action.default_icon[size] = manifest.action.default_icon[size].replace('.svg', '.png');
                }
              });
            }
            
            return JSON.stringify(manifest, null, 2);
          }
        },
        { 
          from: 'popup.html', 
          to: 'popup.html'
        },
        { from: 'icon*.png', to: '[name][ext]' },
        { from: 'icon*.svg', to: '[name][ext]' }
      ]
    })
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', {
                targets: {
                  browsers: 'last 2 versions, > 1%, not dead'
                },
                useBuiltIns: 'usage',
                corejs: 3
              }]
            ],
            plugins: [
              '@babel/plugin-transform-runtime',
              '@babel/plugin-proposal-class-properties'
            ]
          }
        }
      }
    ]
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          format: {
            comments: false,
          },
          compress: {
            drop_console: false, // 프로덕션에서는 true로 설정
            drop_debugger: true,
          },
        },
        extractComments: false,
      }),
    ],
  },
  resolve: {
    fallback: {
      "crypto": require.resolve("crypto-browserify"),
      "stream": require.resolve("stream-browserify")
    }
  }
};
