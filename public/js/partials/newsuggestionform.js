$('.new-suggestion').click((e)=>{
  // TODO make scmoother
  $window.scroll(0); //scroll to top
  $('.view-wrapper').addClass('noscroll');
  $('.suggestion-form').slideDown();

});

// NOTE: no arrow functions here cause this refers to the window, arrow functions do not bind to this jquery they bind the outer, which in this case is the window. read more here.
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this
$('.cancel-button, .suggestion-form').click(function(e){
  if(e.target === this){
    $('.view-wrapper').removeClass('noscroll');
    $('.suggestion-form').slideUp();
  }
});

$('.submit-button').click((e)=>{
  // TODO: check form  or use onchange to check
  // TODO: add input for expiration (still need to figure to automate delete of expires)
  const title = $('#post-title').val();
  const text = $('#post-text').val();
  const color = $('#color-chooser').val();

  const expiration = new Date();
  fetch('/newsuggestion', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      expiration: expiration,
      color: `#${color}`,
      title: title,
      text: text,
      latitude: geojson.features[0].geometry.coordinates[1],
      longitude: geojson.features[0].geometry.coordinates[0],
    })
  })
  .then((res)=>{
    if(res.ok){
      // ummmm.... for now close
      $('.view-wrapper').removeClass('noscroll');
      $('.suggestion-form').slideUp();
    }
  });
});
