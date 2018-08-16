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
// move geocoder and userlocation when resized or is small screen
let prevWidth = 0;
function addGeocoder(windowWidth){
  let appendToClass = ''
  if(windowWidth < 992 && prevWidth > 991){
    appendToClass = '.mapboxgl-ctrl-top-right';
  }
  else if(windowWidth > 991 && prevWidth < 991){
    appendToClass = '.geocoder';
  }
  if (appendToClass === '') return
  $('.mapboxgl-ctrl-geocoder.mapboxgl-ctrl').appendTo(appendToClass);
  $('.mapboxgl-ctrl.mapboxgl-ctrl-group').appendTo(appendToClass);
  prevWidth = windowWidth
}

$window.resize(()=>{
  addGeocoder($window.width());
})

// -------------------------------
// document ready stuff
$(document).ready(()=>{
  addGeocoder($window.width());
})
