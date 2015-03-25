var path = require('path');

module.exports = function (grunt) {
	grunt.initConfig({
			connect : {
				server : {
					options : {
						port : 80,
						base : __dirname + '/build',
						keepalive : true,
						hostname : '*',
						middleware : function (connect, options, middlewares) {
							var redirect = function (req, res, next) {
								var ext = path.extname(req.url);

								// redirect paths ending in .html to bare url
								if ( ext === '.html' ) {
									res.writeHead(302, {
										'Location' : req.url.substring(0, req.url.length - 5)
									});
									res.end();
									return;
								}

								// redirect paths ending in / bare url
								if ( req.url !== '/' && req.url[req.url.length - 1] === '/' ) {
									res.writeHead(302, {
										'Location' : req.url.substring(0, req.url.length - 1)
									});
									res.end();
									return;
								}

								// rewrite site root to index page
								if ( req.url === '/' )
									req.url += 'index';

								// rewrite bare urls to end in .html
								if ( ext === '' )
									req.url += '.html';

								next();
							};
							middlewares.unshift(redirect);
							return middlewares;
						}
					}
				}
			},
			clean : ['build'],
			copy : {
				main : {
					files : [
						{
							// copy main site static files
							expand : true,
							cwd : 'static/',
							src : ['**'],
							dest : 'build/',
							filter : 'isFile'
						},
						{
							// copy and flatten images from blog folders
							expand : true,
							flatten : true,
							cwd : 'content/blog',
							src : ['**/*.{png,jpg,jpeg,gif,svg}'],
							dest : 'build/blog',
							filter : 'isFile'
						}
					]
				}
			},
			m2j : {
				// generate a JSON file of our blog metadata
				blog : {
					files : {
						'build/blog.json' : ['content/blog/**/*.md']
					}
				}
			},
			filetransform : {
				// change the m2j output to be an array of blog posts
				options : {
					map : function (contents) {
						var obj = JSON.parse(contents);
						var keys = Object.keys(obj);

						var array = [];
						for ( var i = 0; i < keys.length; i++ )
							array.push(obj[keys[i]]);

						array.sort(function (a, b) {
							a = a['iso8601Date'];
							b = b['iso8601Date'];
							return ( a < b ? 1 : (a > b ? -1 : 0 ) );
						});
						return JSON.stringify(array, null, '\t');
					}
				},
				blog : {
					files : {
						'build/blog.json' : ['build/blog.json']
					}
				}
			},
			assemble : {
				options : {
					layoutdir : 'templates/layouts',
					partials : ['templates/partials/*.hbs']
				},
				blog : {
					options : {
						layout : 'blog.hbs',
						base : '../'
					},
					expand : true,
					flatten : true,
					cwd : 'content/blog/',
					src : ['**/*.md'],
					dest : 'build/blog/'
				},
				blogIndex : {
					options : {
						layout : 'blogIndex.hbs',
						base : '',
						data : 'build/blog.json'
					},
					expand : true,
					cwd : 'content/',
					src : ['blog.hbs'],
					dest : 'build/'
				},
				index : {
					options : {
						layout : 'index.hbs',
						base : '',
						data : 'build/blog.json'
					},
					expand : true,
					cwd : 'content/',
					src : ['index.hbs'],
					dest : 'build/'
				}
			}
		}
	)
	;

	grunt.task.registerTask('build', ['clean', 'copy', 'm2j', 'filetransform', 'assemble']);

	grunt.loadNpmTasks('grunt-contrib-connect');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-markdown-to-json');
	grunt.loadNpmTasks('grunt-filetransform');
	grunt.loadNpmTasks('assemble');
}
;
