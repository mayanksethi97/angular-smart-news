import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { debounce, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { RootApiService } from '../../services/root-api.service';
import { RootContextService } from '../../services/root-context.service';

declare let annyang: any;
declare let SpeechKITT: any;
@Component({
  selector: 'app-app-landing',
  templateUrl: './app-landing.component.html',
  styleUrls: ['./app-landing.component.scss']
})
export class AppLandingComponent implements OnInit {

  currentUserLocation: any
  hasUserLocation = false;
  locationsData: any[] = [];
  subs: Subscription[] = [];

  constructor(
    private router: Router,
    private rootApiService: RootApiService,
    private activatedRoute: ActivatedRoute,
    private rootContextService: RootContextService
  ) { 
    this.rootContextService.initContext('dashboard');
  }

  ngOnInit(): void {
    this.getUserLocation();
    this.subscribeToContextChange();
    this.setupAnnyang();
  }


  subscribeToContextChange(){
    this.subs.push(this.rootContextService.ContextChange$.subscribe((res: any) => {
      console.log(res);
      this.currentUserLocation = res.extraproperties.currentUserLocation;
      this.hasUserLocation = true;
    }))
  }

  getLocations(searchInput){
    console.log(searchInput)
    this.rootApiService.getLocationsData(searchInput).pipe(
      debounceTime(1000), 
      distinctUntilChanged())
      .subscribe((locations: any) => this.locationsData = locations.locationsArray);
  }
  

  getUserLocation(){
    let gotUserLocation = false;
    if(localStorage.getItem('userLocation')){
      const location = localStorage.getItem('userLocation');
      this.currentUserLocation = JSON.parse(location);
      this.hasUserLocation = true;
    }
    else{
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position)=>{
          console.log(position); 
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            timeStamp: position.timestamp
          }
          gotUserLocation = true;
          this.reverseGeoCode(gotUserLocation, loc);
        });
    } else {
       console.log("No support for geolocation");
       alert("No Support for Geolocation");
    }
    }
  }

  setupAnnyang(){
    if (annyang) {
      var commands = {
        'click enter': () => {
          document.getElementById('enterButton').click();
        },
        'take me inside': () => {
          document.getElementById('enterButton').click();
        },
        'start': () => {
          document.getElementById('enterButton').click();
        }
        
      };
      annyang.addCommands(commands);
      SpeechKITT.annyang();
      SpeechKITT.setStylesheet(
        '//cdnjs.cloudflare.com/ajax/libs/SpeechKITT/0.3.0/themes/flat.css'
      );
      SpeechKITT.setSampleCommands(['take me to punjab', 'navigate to delhi', 'show my city weather details']);
      SpeechKITT.vroom();
    }
  }

  reverseGeoCode(gotUserLocation, loc){
    if(gotUserLocation){
      this.rootApiService.reverseGeoCode({lat: loc.lat, lng: loc.lng}).subscribe((res: any) => {
        console.log(res);
        const userLocation = {
          lat: res.features[0].properties.lat,
          lng: res.features[0].properties.lon,
          state: res.features[0].properties.state,
          country: res.features[0].properties.country
        }
        localStorage.setItem('userLocation', JSON.stringify(userLocation));
        this.rootContextService.updateCurrentContext({currentUserLocation: userLocation});
      })
    }
  }

  selectUserLocation(location){
    const loc = {
      lat: location.lat,
      lng: location.lon,
      state: location.state,
      country: location.country
    }
    this.rootContextService.updateCurrentContext({currentUserLocation: loc})
    localStorage.setItem('userLocation', JSON.stringify(loc));
    this.hasUserLocation = true;
  }

  ngOnDestroy(){
    this.subs.forEach(s => {
      if(s){
        s.unsubscribe();
      }
    });
  }

}
