const _ = require('lodash');

try {
  if (_.isEmpty(process.env.GITHUB_ACCESS_TOKEN)) {
    throw Error('GITHUB_ACCESS_TOKEN is required');
  }

  const app = require('./app');

  const port = ( parseInt(process.env.PORT) || 3103 );

  app.listen(port, () => {
    console.log(`submit-service is now running on port ${port}`);
  });

} catch (err) {
  console.error(err.toString());
  process.exit(1);

}
