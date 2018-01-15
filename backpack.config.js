module.exports = {
  webpack: (config, options, webpack) => {
    config.entry.main = [
      './src/index.ts',
    ];

    config.resolve = {
      extensions: ['.ts', '.js', '.json'],
    };

    config.plugins.push(
      new webpack.WatchIgnorePlugin([
        /\.js$/,
        /\.d\.ts$/,
      ]),
    );

    config.module.rules.push(
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        loader: 'ts-loader',
      },
    );

    return config;
  },
};
