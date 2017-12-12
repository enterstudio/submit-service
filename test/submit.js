const tape = require('tape');
const express = require('express');
const request = require('request-promise');
const proxyquire = require('proxyquire').noCallThru();
const string2stream = require('string-to-stream');

tape('/submit tests', test => {
  test.test('request failing authentication should respond with 400 and error message', t => {
    t.plan(5);

    // mock the github in the submit route
    const submit_route = proxyquire('../submit', {
      'github': function GitHub() {
        return {
          authenticate: (auth_params) => {
            t.deepEquals(auth_params, {
              type: 'oauth',
              token: 'my super secret token'
            });
          },
          users: {
            get: (users_get_params) => {
              t.deepEquals(users_get_params, {});

              return new Promise((resolve, reject) => reject('user authentication failed'));

            }
          },
          gitdata: {
            getReference: t.fail.bind(null, 'gitdata.getReference should not have been called'),
            createReference: t.fail.bind(null, 'gitdata.createReference should not have been called')
          },
          repos: {
            createFile: t.fail.bind(null, 'repos.createFile should not have been called')
          },
          pullRequests: {
            create: () => t.fail.bind(null, 'pullRequests.create should not have been called')
          }
        };
      }
    });

    const submit_service = express().use('/', submit_route).listen();

    request({
      uri: `http://localhost:${submit_service.address().port}/`,
      method: 'POST',
      qs: {},
      json: true,
      resolveWithFullResponse: true
    })
    .then(t.fail.bind(null, 'request should not have been successful'))
    .catch(err => {
      t.equals(err.statusCode, 400);
      t.equals(err.response.headers['content-type'], 'application/json; charset=utf-8');
      t.deepEquals(err.error, {
        error: {
          code: 400,
          message: 'Error looking up login name: user authentication failed'
        }
      });
    })
    .finally(() => {
      submit_service.close();
    });

  });

  test.test('request failing to look up master reference should respond with 400 and error message', t => {
    t.plan(6);

    // mock the github in the submit route
    const submit_route = proxyquire('../submit', {
      'github': function GitHub() {
        return {
          authenticate: (auth_params) => {
            t.deepEquals(auth_params, {
              type: 'oauth',
              token: 'my super secret token'
            });
          },
          users: {
            get: (users_get_params) => {
              t.deepEquals(users_get_params, {});

              return new Promise((resolve, reject) => resolve({
                data: {
                  login: 'submit_service username'
                }
              }));

            }
          },
          gitdata: {
            getReference: (o) => {
              t.deepEquals(o, {
                owner: 'openaddresses',
                repo: 'openaddresses',
                ref: 'heads/master'
              });

              return new Promise((resolve, reject) => reject('getReference for master failed'));

            },
            createReference: t.fail.bind(null, 'gitdata.createReference should not have been called')
          },
          repos: {
            createFile: t.fail.bind(null, 'repos.createFile should not have been called')
          },
          pullRequests: {
            create: () => t.fail.bind(null, 'pullRequests.create should not have been called')
          }
        };
      }
    });

    const submit_service = express().use('/', submit_route).listen();

    request({
      uri: `http://localhost:${submit_service.address().port}/`,
      method: 'POST',
      qs: {},
      json: true,
      resolveWithFullResponse: true
    })
    .then(t.fail.bind(null, 'request should not have been successful'))
    .catch(err => {
      t.equals(err.statusCode, 400);
      t.equals(err.response.headers['content-type'], 'application/json; charset=utf-8');
      t.deepEquals(err.error, {
        error: {
          code: 400,
          message: 'Error looking up master reference: getReference for master failed'
        }
      });
    })
    .finally(() => {
      submit_service.close();
    });

  });

  test.test('request failing to create local reference should respond with 400 and error message', t => {
    t.plan(7);

    // mock the github in the submit route
    const submit_route = proxyquire('../submit', {
      'github': function GitHub() {
        return {
          authenticate: (auth_params) => {
            t.deepEquals(auth_params, {
              type: 'oauth',
              token: 'my super secret token'
            });
          },
          users: {
            get: (users_get_params) => {
              t.deepEquals(users_get_params, {});

              return new Promise((resolve, reject) => resolve({
                data: {
                  login: 'submit_service username'
                }
              }));

            }
          },
          gitdata: {
            getReference: (o) => {
              t.deepEquals(o, {
                owner: 'openaddresses',
                repo: 'openaddresses',
                ref: 'heads/master'
              });

              return new Promise((resolve, reject) => resolve({
                data: {
                  object: {
                    sha: 'master sha'
                  }
                }
              }));

            },
            createReference: (o) => {
              t.deepEquals(o, {
                owner: 'submit_service username',
                repo: 'openaddresses',
                ref: 'refs/heads/submit_service_test',
                sha: 'master sha'
              });

              return new Promise((resolve, reject) => reject('createReference from master failed'));

            }
          },
          repos: {
            createFile: t.fail.bind(null, 'repos.createFile should not have been called')
          },
          pullRequests: {
            create: () => t.fail.bind(null, 'pullRequests.create should not have been called')
          }
        };
      }
    });

    const submit_service = express().use('/', submit_route).listen();

    request({
      uri: `http://localhost:${submit_service.address().port}/`,
      method: 'POST',
      qs: {},
      json: true,
      resolveWithFullResponse: true
    })
    .then(t.fail.bind(null, 'request should not have been successful'))
    .catch(err => {
      t.equals(err.statusCode, 400);
      t.equals(err.response.headers['content-type'], 'application/json; charset=utf-8');
      t.deepEquals(err.error, {
        error: {
          code: 400,
          message: 'Error creating local reference: createReference from master failed'
        }
      });
    })
    .finally(() => {
      submit_service.close();
    });

  });

  test.test('request failing to create file in local reference should respond with 400 and error message', t => {
    t.plan(8);

    // mock the github in the submit route
    const submit_route = proxyquire('../submit', {
      'github': function GitHub() {
        return {
          authenticate: (auth_params) => {
            t.deepEquals(auth_params, {
              type: 'oauth',
              token: 'my super secret token'
            });
          },
          users: {
            get: (users_get_params) => {
              t.deepEquals(users_get_params, {});

              return new Promise((resolve, reject) => resolve({
                data: {
                  login: 'submit_service username'
                }
              }));

            }
          },
          gitdata: {
            getReference: (o) => {
              t.deepEquals(o, {
                owner: 'openaddresses',
                repo: 'openaddresses',
                ref: 'heads/master'
              });

              return new Promise((resolve, reject) => resolve({
                data: {
                  object: {
                    sha: 'master sha'
                  }
                }
              }));

            },
            createReference: (o) => {
              t.deepEquals(o, {
                owner: 'submit_service username',
                repo: 'openaddresses',
                ref: 'refs/heads/submit_service_test',
                sha: 'master sha'
              });

              return new Promise((resolve, reject) => resolve());

            }
          },
          repos: {
            createFile: (o) => {
              t.deepEquals(o, {
                owner: 'submit_service username',
                repo: 'openaddresses',
                path: 'sources/us/nh/city_of_auburn_test.json',
                message: 'this is the commit message',
                content: Buffer.from(post_content).toString('base64'),
                branch: 'submit_service_test'
              });

              return new Promise((resolve, reject) => reject('createFile in local reference failed'));

            }
          },
          pullRequests: {
            create: () => t.fail.bind(null, 'pullRequests.create should not have been called')
          }
        };
      }
    });

    const submit_service = express().use('/', submit_route).listen();

    const post_content = 'this is the POST content for /submit';

    request({
      uri: `http://localhost:${submit_service.address().port}/`,
      method: 'POST',
      formData: {
        source: {
          value: string2stream(post_content),
          options: {
            filename: `file.json`,
            contentType: 'application/json',
            knownLength: post_content.length
          }
        }
      },
      headers: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      json: true,
      resolveWithFullResponse: true
    })
    .then(t.fail.bind(null, 'request should not have been successful'))
    .catch(err => {
      t.equals(err.statusCode, 400);
      t.equals(err.response.headers['content-type'], 'application/json; charset=utf-8');
      t.deepEquals(err.error, {
        error: {
          code: 400,
          message: 'Error creating file for reference: createFile in local reference failed'
        }
      });
    })
    .finally(() => {
      submit_service.close();
    });

  });

  test.test('request failing to create pull request should respond with 400 and error message', t => {
    t.plan(9);

    const post_content = 'this is the POST content for /submit';

    // mock the github in the submit route
    const submit_route = proxyquire('../submit', {
      'github': function GitHub() {
        return {
          authenticate: (auth_params) => {
            t.deepEquals(auth_params, {
              type: 'oauth',
              token: 'my super secret token'
            });
          },
          users: {
            get: (users_get_params) => {
              t.deepEquals(users_get_params, {});

              return new Promise((resolve, reject) => resolve({
                data: {
                  login: 'submit_service username'
                }
              }));

            }
          },
          gitdata: {
            getReference: (o) => {
              t.deepEquals(o, {
                owner: 'openaddresses',
                repo: 'openaddresses',
                ref: 'heads/master'
              });

              return new Promise((resolve, reject) => resolve({
                data: {
                  object: {
                    sha: 'master sha'
                  }
                }
              }));

            },
            createReference: (o) => {
              t.deepEquals(o, {
                owner: 'submit_service username',
                repo: 'openaddresses',
                ref: 'refs/heads/submit_service_test',
                sha: 'master sha'
              });

              return new Promise((resolve, reject) => resolve());

            }
          },
          repos: {
            createFile: (o) => {
              t.deepEquals(o, {
                owner: 'submit_service username',
                repo: 'openaddresses',
                path: 'sources/us/nh/city_of_auburn_test.json',
                message: 'this is the commit message',
                content: Buffer.from(post_content).toString('base64'),
                branch: 'submit_service_test'
              });

              return new Promise((resolve, reject) => resolve());

            }
          },
          pullRequests: {
            create: (o) => {
              t.deepEquals(o, {
                owner: 'openaddresses',
                repo: 'openaddresses',
                title: 'Submit Service Pull Request',
                head: 'submit_service username:submit_service_test',
                base: 'master',
                body: 'This pull request contains changes requested by the Submit Service',
                maintainer_can_modify: true
              });

              return new Promise((resolve, reject) => reject('createPullRequest failed'));

            }
          }
        };
      }
    });

    const submit_service = express().use('/', submit_route).listen();

    request({
      uri: `http://localhost:${submit_service.address().port}/`,
      method: 'POST',
      formData: {
        source: {
          value: string2stream(post_content),
          options: {
            filename: `file.json`,
            contentType: 'application/json',
            knownLength: post_content.length
          }
        }
      },
      headers: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      json: true,
      resolveWithFullResponse: true
    })
    .then(t.fail.bind(null, 'request should not have been successful'))
    .catch(err => {
      t.equals(err.statusCode, 400);
      t.equals(err.response.headers['content-type'], 'application/json; charset=utf-8');
      t.deepEquals(err.error, {
        error: {
          code: 400,
          message: 'Error creating pull request: createPullRequest failed'
        }
      });
    })
    .finally(() => {
      submit_service.close();
    });

  });

  test.test('request creating pull request should return 200 and PR link', t => {
    t.plan(9);

    const post_content = 'this is the POST content for /submit';

    // mock the github in the submit route
    const submit_route = proxyquire('../submit', {
      'github': function GitHub() {
        return {
          authenticate: (auth_params) => {
            t.deepEquals(auth_params, {
              type: 'oauth',
              token: 'my super secret token'
            });
          },
          users: {
            get: (users_get_params) => {
              t.deepEquals(users_get_params, {});

              return new Promise((resolve, reject) => resolve({
                data: {
                  login: 'submit_service username'
                }
              }));

            }
          },
          gitdata: {
            getReference: (o) => {
              t.deepEquals(o, {
                owner: 'openaddresses',
                repo: 'openaddresses',
                ref: 'heads/master'
              });

              return new Promise((resolve, reject) => resolve({
                data: {
                  object: {
                    sha: 'master sha'
                  }
                }
              }));

            },
            createReference: (o) => {
              t.deepEquals(o, {
                owner: 'submit_service username',
                repo: 'openaddresses',
                ref: 'refs/heads/submit_service_test',
                sha: 'master sha'
              });

              return new Promise((resolve, reject) => resolve());

            }
          },
          repos: {
            createFile: (o) => {
              t.deepEquals(o, {
                owner: 'submit_service username',
                repo: 'openaddresses',
                path: 'sources/us/nh/city_of_auburn_test.json',
                message: 'this is the commit message',
                content: Buffer.from(post_content).toString('base64'),
                branch: 'submit_service_test'
              });

              return new Promise((resolve, reject) => resolve());

            }
          },
          pullRequests: {
            create: (o) => {
              t.deepEquals(o, {
                owner: 'openaddresses',
                repo: 'openaddresses',
                title: 'Submit Service Pull Request',
                head: 'submit_service username:submit_service_test',
                base: 'master',
                body: 'This pull request contains changes requested by the Submit Service',
                maintainer_can_modify: true
              });

              return new Promise((resolve, reject) => resolve({
                data: {
                  html_url: 'this is the html url for the pull request'
                }
              }));

            }
          }
        };
      }
    });

    const submit_service = express().use('/', submit_route).listen();

    request({
      uri: `http://localhost:${submit_service.address().port}/`,
      method: 'POST',
      formData: {
        source: {
          value: string2stream(post_content),
          options: {
            filename: `file.json`,
            contentType: 'application/json',
            knownLength: post_content.length
          }
        }
      },
      headers: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      json: true,
      resolveWithFullResponse: true
    })
    .then(response => {
      t.equals(response.statusCode, 200);
      t.equals(response.headers['content-type'], 'application/json; charset=utf-8');
      t.deepEquals(response.body, {
        response: {
          url: 'this is the html url for the pull request'
        }
      });
    })
    .catch(err => t.fail.bind(null, 'request should have been successful'))
    .finally(() => {
      submit_service.close();
    });

  });

});