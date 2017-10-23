'use strict';

module.exports = function(grunt) {

	grunt.initConfig({		
	    jsdoc: {
	        dist: {
	            src: ['lib/**/*.js'],
	            options: {
		            configure: 'jsdoc.json',
	                destination: 'docs'
	            }
	        }
	    },
	    watch: {
			scripts: {
				files: ['lib/**/*.js'],
				tasks: ['jsdoc'],
				options: {
					spawn: false,
				}
			}
		}
	});
	
	grunt.loadNpmTasks('grunt-jsdoc');
	grunt.loadNpmTasks('grunt-contrib-watch');


};