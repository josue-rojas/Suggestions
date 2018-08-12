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

// object containing input checks corresponding to their id
const checkinput = {
  'post-title': (val)=> {return val.length > 0 && val.length < 256},
  'post-text': (val)=> {return val.length > 0 && val.length < 256},
  'color-chooser': (val)=> {
    $temp = $('<div>');
    $temp.css('color', `#${val}`);
    return $temp.css('color') !== '';
  },
};
// keep track of input validation (they all start at false)
let inputState = {
  'post-title': false,
  'post-text': false,
  'color-chooser': false
};

function checkValid($target){
  if(checkinput[$target.attr('id')]($target.val())){
    inputState[$target.attr('id')] = true;
    $target.removeClass('invalid');
    return true
  }
  else{
    inputState[$target.attr('id')] = false;
    $target.addClass('invalid');
    return false
  }
}

$('.suggestion-form form input').keyup(function(e){
  const $e = $(e.target);
  checkValid($e);
});
// color-chooser may change with the colorbox instead of typing
$('.suggestion-form form input#color-chooser').change(function(e){
  const $e = $(e.target);
  checkValid($e);
});

function submitForm(){
  // TODO: add input for expiration (still need to figure to automate delete of expires)
  let hasInvalid = 0;
  for(let e in inputState){
    hasInvalid+= checkValid($(`#${e}`)) ? 0 : 1;
  }

  if(hasInvalid !== 0) return false;

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
      // TODO: should add point (not refresh since we already know the point info)
    }
  });
}

$('.submit-button').click((e)=>{
  submitForm();
});

$('.suggestion-form form input').keypress((e)=>{
  if (e.which == 13) {
    submitForm();
    return false;    //<---- Add this line
  }
});
