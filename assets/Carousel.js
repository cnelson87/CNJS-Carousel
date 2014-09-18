/*
	TITLE: Carousel

	DESCRIPTION: responsive carousel

	VERSION: 0.1.0

	USAGE: var myCarousel = new Carousel('Element', 'Options')
		@param {jQuery Object}
		@param {Object}

	AUTHORS: CN

	DEPENDENCIES:
		- jQuery 1.10+
		- greensock
		- Class.js

*/

var Carousel = Class.extend({
	init: function($el, objOptions) {

		// defaults
		this.$window	= $(window);
		this.$el		= $el;
		this.options	= $.extend({
			initialIndex		: 0,
			numVisibleItems		: 1,
			numItemsToAnimate	: 1,
			isResponsive		: true,
			enableSwipe			: true,
			highlightActive		: true,
			selectorNavPrev		: '.nav-prev',
			selectorNavNext		: '.nav-next',
			selectorInnerTrack	: '.inner-track > ul',
			selectorItems		: '> li',
			classActiveItem		: 'active',
			classNavDisabled	: 'disabled',
			animDuration		: 0.8,
			animEasing			: 'Power4.easeOut',
			customEventPrfx		: 'CNJS:Carousel'
		}, objOptions || {});

		// element references
		this.$elNavPrev		= this.$el.find(this.options.selectorNavPrev);
		this.$elNavNext		= this.$el.find(this.options.selectorNavNext);
		this.$elInnerTrack	= this.$el.find(this.options.selectorInnerTrack);
		this.$elItems 		= this.$elInnerTrack.find(this.options.selectorItems);

		// setup & properties
		this.isAnimating	= false;
		this.containerWidth = this.$el.width();
		this.lenItems		= this.$elItems.length;
		this.itemWidth		= $(this.$elItems[0]).width();
		this.scrollAmt		= this.itemWidth * -1;
		this.isResponsive	= this.options.isResponsive;
		this.numVisibleItems	= this.options.numVisibleItems;
		this.numItemsToAnimate	= this.options.numItemsToAnimate;
		if (this.options.initialIndex >= this.lenItems) {
			this.options.initialIndex = 0;
		}
		this.currentIndex	= this.options.initialIndex;
		this.lastIndex		= this.lenItems - this.numVisibleItems;


		if (this.isResponsive) {
			this.initResponsiveDOM();
		} else {
			this.initDOM();
		}

	},


/**
*	Private Methods
**/

	initDOM: function() {
		var elCurrentItem = $(this.$elItems[this.currentIndex]);
		var trackWidth = this.itemWidth * this.lenItems;
		var leftPos = this.scrollAmt * this.currentIndex;

		// disable nav links if not enough visible items
		this.updateNav();
		if (this.lenItems <= this.options.numVisibleItems) {
			this.$elNavPrev.addClass(this.options.classNavDisabled);
			this.$elNavNext.addClass(this.options.classNavDisabled);
		}

		// adjust initial position
		TweenMax.set(this.$elInnerTrack, {
			left: leftPos
		}); 

		if (this.options.highlightActive) {
			elCurrentItem.addClass(this.options.classActiveItem);
		}

		$.event.trigger(this.options.customEventPrfx + ':isInitialized', [this.$el]);

		this.bindEvents();

	},

	initResponsiveDOM: function() {
		var elCurrentItem = $(this.$elItems[this.currentIndex]);
		var trackWidth = (this.lenItems * 100);
		var leftPos;

		this.itemWidth = ((100 / this.lenItems) / this.numVisibleItems);

		this.scrollAmt = (100 / (this.numVisibleItems / this.numItemsToAnimate)) * -1;

		console.log(this.scrollAmt);

		leftPos = this.scrollAmt * this.currentIndex;

		// disable nav links if not enough visible items
		this.updateNav();
		if (this.lenItems <= this.options.numVisibleItems) {
			this.$elNavPrev.addClass(this.options.classNavDisabled);
			this.$elNavNext.addClass(this.options.classNavDisabled);
		}

		// adjust initial position
		this.$elItems.css({width: this.itemWidth+'%'});
		TweenMax.set(this.$elInnerTrack, {
			width: trackWidth+'%',
			left: leftPos+'%'
		}); 

		if (this.options.highlightActive) {
			elCurrentItem.addClass(this.options.classActiveItem);
		}

		$.event.trigger(this.options.customEventPrfx + ':isInitialized', [this.$el]);

		this.bindEvents();

	},

	bindEvents: function() {
		var self = this;

		this.$elNavPrev.on('click', function(event) {
			event.preventDefault();
			if (!this.$elNavPrev.hasClass(this.options.classNavDisabled) && !this.isAnimating) {
				this.__clickNavPrev(event);
			}
		}.bind(this));

		this.$elNavNext.on('click', function(event) {
			event.preventDefault();
			if (!this.$elNavNext.hasClass(this.options.classNavDisabled) && !this.isAnimating) {
				this.__clickNavNext(event);
			}
		}.bind(this));

		if (this.options.enableSwipe) {
			this.$el.swipe({
				excludedElements: ".noSwipe",
				threshold: 50,
				triggerOnTouchEnd: false, // triggers on threshold
				swipeLeft: function(event, distance, duration, fingerCount) {
					if (!self.$elNavNext.hasClass(self.options.classNavDisabled) && !self.isAnimating) {
						self.__clickNavNext(event);
					}
				},
				swipeRight: function(event, distance, duration, fingerCount) {
					if (!self.$elNavPrev.hasClass(self.options.classNavDisabled) && !self.isAnimating) {
						self.__clickNavPrev(event);
					}
				},
				fingers: $.fn.swipe.fingers.ALL
			});
		}

	},


/**
*	Event Handlers
**/

	__clickNavPrev: function(e) {
		this.currentIndex -= this.numItemsToAnimate;
		if (this.currentIndex < 0) {
			this.currentIndex = 0;
		}
		this.updateCarousel();
	},

	__clickNavNext: function(e) {
		this.currentIndex += this.numItemsToAnimate;
		if (this.currentIndex + this.numVisibleItems >= this.lenItems) {
			this.currentIndex = this.lenItems - this.numVisibleItems;
		}
		this.updateCarousel();
	},


/**
*	Public Methods
**/

	updateCarousel: function() {
		var self = this;
		var unit = this.isResponsive ? '%' : 'px';
		var leftPos = (this.scrollAmt * this.currentIndex) + unit;
		var elCurrentItem = $(this.$elItems[this.currentIndex]);

		this.isAnimating = true;

		if (this.options.highlightActive) {
			this.$elItems.removeClass(this.options.classActiveItem);
		}

		this.updateNav();

		TweenMax.to(this.$elInnerTrack, this.options.animDuration, {
			left: leftPos,
			ease: self.options.animEasing,
			onComplete: function() {
				self.isAnimating = false;
				if (self.options.highlightActive) {
					elCurrentItem.addClass(self.options.classActiveItem);
				}
			}
		});

		$.event.trigger(this.options.customEventPrfx + ':carouselUpdated', [this.currentIndex]);

	},

	updateNav: function() {

		this.$elNavPrev.removeClass(this.options.classNavDisabled);
		this.$elNavNext.removeClass(this.options.classNavDisabled);

		if (this.currentIndex <= 0) {
			this.$elNavPrev.addClass(this.options.classNavDisabled);
		}

		if (this.currentIndex >= this.lastIndex) {
			this.$elNavNext.addClass(this.options.classNavDisabled);
		}

	}

});


//uncomment to use as a browserify module
//module.exports = Carousel;
