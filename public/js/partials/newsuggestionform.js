$('.new-suggestion').click((e)=>{
  // TODO make scmoother
  $window.scroll(0); //scroll to top
  $('.view-wrapper').addClass('noscroll');
  $('.suggestion-form').slideDown();

});


$('.cancel-button').click((e)=>{
  $('.view-wrapper').removeClass('noscroll');
  $('.suggestion-form').slideUp();
});

// NOTE: no arrow functions here cause this refers to the window, arrow functions do not bind to this jquery they bind the outer, which in this case is the window. read more here.
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this
$('.suggestion-form').click(function(e){
  if(e.target === this){
    $('.view-wrapper').removeClass('noscroll');
    $('.suggestion-form').slideUp();
  }
});
