const express = require('express');
const router = express.Router();
const GitHubApi = require('github');
const fileUpload = require('express-fileupload');

const winston = require('winston');
const logger = winston.createLogger({
  level: 'debug',
  transports: [
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

async function createBranch(req, res, next) {
  const github = new GitHubApi();

  const token = 'my super secret token';
  const reference_name = 'submit_service_test';
  const commit_message = 'this is the commit message';
  const path = 'sources/us/nh/city_of_auburn_test.json';
  const pull_request_text = 'This pull request contains changes requested by the Submit Service';
  const pull_request_title = 'Submit Service Pull Request';

  // first, authenticate the user
  github.authenticate({
    type: 'oauth',
    token: token
  });

  // second, get the github username for this authentication
  // user_response.data.login is needed for future steps
  let user_response;
  try {
    user_response = await github.users.get({});

  } catch (err) {
    logger.error(`Error looking up login name: ${err}`);
    return res.status(400).type('application/json').send({
      error: {
        code: 400,
        message: `Error looking up login name: ${err}`
      }
    });
  }

  // third, lookup the sha of openaddresses/openaddresses#master
  // master_reference_response.data.object.sha is needed when creating a reference
  let master_reference_response;
  try {
    master_reference_response = await github.gitdata.getReference({
      owner: 'openaddresses',
      repo: 'openaddresses',
      ref: 'heads/master'
    });

  } catch (err) {
    logger.error(`Error looking up master reference: ${err}`);
    return res.status(400).type('application/json').send({
      error: {
        code: 400,
        message: `Error looking up master reference: ${err}`
      }
    });
  }

  // fourth, create the reference for the authenticated user
  try {
    await github.gitdata.createReference({
      owner: user_response.data.login,
      repo: 'openaddresses',
      ref: `refs/heads/${reference_name}`,
      sha: master_reference_response.data.object.sha
    });

  } catch (err) {
    logger.error(`Error creating local reference: ${err}`);
    return res.status(400).type('application/json').send({
      error: {
        code: 400,
        message: `Error creating local reference: ${err}`
      }
    });
  }

  // fifth, create the file in the local reference for the authenticated user
  try {
    await github.repos.createFile({
      owner: user_response.data.login,
      repo: 'openaddresses',
      path: path,
      message: commit_message,
      content: Buffer.from(req.files.source.data).toString('base64'),
      branch: reference_name
    });

  } catch (err) {
    logger.error(`Error creating file for reference: ${err}`);
    return res.status(400).type('application/json').send({
      error: {
        code: 400,
        message: `Error creating file for reference: ${err}`
      }
    });
  }

  // sixth, create the pull request
  let create_pull_request_response;
  try {
    create_pull_request_response = await github.pullRequests.create({
      owner: 'openaddresses',
      repo: 'openaddresses',
      title: pull_request_title,
      head: `${user_response.data.login}:${reference_name}`,
      base: 'master',
      body: pull_request_text,
      maintainer_can_modify: true
    });

  } catch (err) {
    logger.error(`Error creating pull request: ${err}`);
    return res.status(400).type('application/json').send({
      error: {
        code: 400,
        message: `Error creating pull request: ${err}`
      }
    });
  }

  // entire github pipeline was successful so return the PR URL
  res.status(200).type('application/json').send({
    response: {
      url: create_pull_request_response.data.html_url
    }
  });

  next();

}

// use express-fileupload for handling uploads
router.use(fileUpload());

router.post('/', createBranch);

module.exports = router;
