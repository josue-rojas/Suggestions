const $window = $(window);

// TODO: make transition smoother
$window.scroll((e)=>{
  const $sidebar = $('.sidebar');
 // $sidebar.outerHeight()+($window.outerHeight()*.7)- $window.outerHeight());
  if($(document).height() == $(window).scrollTop() + $(window).height()){
    $sidebar.removeClass('noscroll')
  }
  else if(!$sidebar.hasClass('noscroll')){
    $sidebar.addClass('noscroll');
  }
});

// -------------------------------
// add or remove geocoder when resized or is small screen
function addGeocoder(windowWidth){
  if(windowWidth < 992){
    $('.mapboxgl-ctrl-top-right').empty();
    map.addControl(geocoder);
    map.addControl(userlocation);
  }
  else{
    $('.geocoder').empty();
    document.getElementById('geocoder').appendChild(geocoder.onAdd(map));
    document.getElementById('geocoder').appendChild(userlocation.onAdd(map));
  }
}

$window.resize(()=>{
  addGeocoder($window.width());
})

// -------------------------------
// document ready stuff
$(document).ready(()=>{
  addGeocoder($window.width());
})
