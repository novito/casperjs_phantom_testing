var casper = require('casper').create();

casper.start(casper.cli.get(0), function() {
});

/* Casper configuration */

casper.on('remote.message', function(msg) {
    this.echo('remote message caught: ' + msg);
})

function getProductImage()
{
	// Get all images
	var images = document.getElementsByTagName('img'); 

	// Get sizes of all images
	
	return images;
}


// Then find all pictures
casper.then(function() {
	this.evaluate(function() {
		window.parseAds = {

			//Initialize score of all images to zero
			initializeScores: function(images, value) {

				for (var i = 0; i < images.length; i++){
					images[i].score = 0; 
				}
			},

			// Score images depending on their square size 
			scoreImagesBySquareSize: function(images, avg_square_size) {
			
				var base_score = 10;
				for (var i = 0; i < images.length; i++) {
					if (images[i].square_size >= avg_square_size) {
						images[i].score = base_score * (images[i].square_size - avg_square_size);
					}
				}
			},

			getImageWithBiggestScore: function(images) {

				var best_scored_image = images[0];

				for (var i = 1; i < images.length; i++) {
					if (images[i].score > best_scored_image.score) {
						best_scored_image = images[i];
					}
				}

				return best_scored_image;
			},
			
			// Calculate square size of images
			setSquareSizes: function(images) {
				for (var i = 0; i < images.length; i++){
					images[i].square_size = images[i].height * images[i].width; 
				}
			},	

			// If proportions of images are likely to be a banner, penalty scores 
			penaltyBannerImages: function(images) {

				for (var i = 0; i < images.length; i++) {
					if (images[i].width > images[i].height * 5) {
						images[i].score = images[i].score * 0.5;	
					}
				}
			},

			getAverageSquareSize: function(images) {
				var n_images = images.length;
				var total_square_size = 0;
				
				for (var i = 0; i < images.length; i++) {
					total_square_size += images[i].square_size; 
				}

				return total_square_size/n_images;
			},

			// Functions related to get the logo

			// Get just the images that are in the top of the page
			prizeTopImages: function(top_limit, images) {
				for (var i=0; i < images.length; i++) {
					// If it's under top limit, remove it.
					if (images[i].getBoundingClientRect().top < top_limit) {
						images[i].score += 50;
					}	
				}
			},

			prizeWithLogoInName: function(images) {
				for (var i=0; i < images.length; i++) {
					if (images[i].src.indexOf("logo") > -1) {
						images[i].score += 30;
					}
				}
			}, 

			prizePNG: function(images) {
				for (var i=0; i < images.length; i++) {
					if (images[i].src.indexOf(".png") > -1 || images[i].src.indexOf(".PNG") > -1) {
						images[i].score += 10;
					}
				}	
			},

			//Get all images from the page
			getAllImages: function() {

				return document.getElementsByTagName('img');
			}
		};
	});

});

casper.then(function() {
	this.evaluate(function() {

		var images = parseAds.getAllImages();
		var logos = parseAds.getAllImages();

		/* Get product image */ 
		/* TODO -> Remove images that are really small */
		//parseAds.setSquareSizes(images);
		//parseAds.initializeScores(images,0);

		//var avg_square_size = parseAds.getAverageSquareSize(images);
		//parseAds.scoreImagesBySquareSize(images,avg_square_size);
		//parseAds.penaltyBannerImages(images);

		//var biggest_image = parseAds.getImageWithBiggestScore(images);


		// Try to get the logo
		parseAds.setSquareSizes(logos);
		parseAds.initializeScores(logos,0);
		parseAds.prizeTopImages(150,logos);
		parseAds.prizeWithLogoInName(logos);
		parseAds.prizePNG(logos);

   /*     for (var i = 0; i < logos.length; i++) {*/
			//console.log("Score for this logo: " + logos[i].src);
			//console.log("Score: +" + logos[i].score);
		//}

		var best_logo = parseAds.getImageWithBiggestScore(logos);
		console.log("Best logo: " + best_logo.src);

	});
});


casper.run();
























/*function getParagraphText(p)*/
//{
	//return p.textContent || p.innerText || '';
/*}*/

/*function findBigParagraphs()*/
//{
	//var threeshold = 10;
	//var ps = document.getElementsByTagName('p');

	//console.log(window.getComputedStyle(ps[0]).getPropertyValue('font-size'));

	//[>for (var i = 0; i < ps.length; i++) {<]
		////if ( (window.getComputedStyle(ps[i]).getPropertyValue('font-size')) > threeshold) {
			////big_ps.push(ps[i]);
		////}
	//[>}<]

	//return 3;
/*}*/




