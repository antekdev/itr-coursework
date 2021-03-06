import { Component, OnInit } from '@angular/core';
import {FirebaseService} from '../../firebase.service';
import * as firebase from 'firebase';
import {Router} from '@angular/router';
import {AlgoliaService} from '../../algolia.service';

class Guide {
  gid: string;
  title: string;
  author: string;
  rating: Array<object>;
  totalRating: number;
  category: string;
  creationDate: number;
  contents: Array<Object>;
  comments: Array<String>;
  constructor(title,
              author,
              category,
              contents) {
    this.gid = this.generateId(16);
    this.title = title;
    this.author = author;
    this.rating = [];
    this.totalRating = 0;
    this.category = category;
    this.creationDate = Math.round(new Date().getTime()/1000);
    this.contents = contents;
    this.comments = [];
  }

  static dec2hex(dec) {
    return ('0' + dec.toString(16)).substr(-2);
  }

  generateId(len) {
    let arr = new Uint8Array((len || 40) / 2);
    window.crypto.getRandomValues(arr);
    return Array.from(arr, Guide.dec2hex).join('');
  }
}

@Component({
  selector: 'app-create',
  templateUrl: './create.component.html',
  styleUrls: ['./create.component.css']
})
export class CreateComponent implements OnInit {


  title: string;
  author: string;
  category: string = 'Other';
  steps: Array<object> = [];
  imagesRef;
  categories: Array<string> = ['Other', 'Cuisine', 'Art', 'Tech', 'Lifestyle', 'Fashion'];

  constructor(private fbs: FirebaseService, private router: Router, private alg: AlgoliaService) {
    this.imagesRef = fbs.storage.ref().child('images');
    this.addStep();
    this.title = 'defaultTitle';
    this.author = firebase.auth().currentUser.displayName;
  }

  ngOnInit() {
  }

  addStep() {
    let i = this.steps.length;
    this.steps.push({
      title: 'Step ' + (i+1),
      text: '',
      images: [''],
    });
  }

  removeStep(){
    this.steps.pop();
  }

  chooseCategory() {
    // @ts-ignore
    this.category = document.getElementById('selectline').value;
  }

  editField(event) {
    let text = event.srcElement.value;
    let id = event.srcElement.id;
    if (id == 'headline') this.title = text;
    else if (id.includes('text')) {
      let i = id.replace('text', '');
      // @ts-ignore
      this.steps[i].text = text;
    }
    else {
      let i = id.replace('title', '');
      // @ts-ignore
      this.steps[i].title = text;
    }
  }

  onFileSelected(event, i, fileIndex) {
    // @ts-ignore
    let title = document.getElementById('headline').innerText.replace(' ', '');
    // @ts-ignore
    let n = this.steps[i].images.length;
    let author = this.author.replace(' ', '');
    let image = event.target.files[0];
    let temp = (Math.floor(Math.random() * 6000) + 1).toString();
    let imageRef = this.imagesRef.child(author + title + i + n + temp + '.jpg');
    imageRef.put(image).then(() => {
      imageRef.getDownloadURL().then(link => {
        // @ts-ignore
        this.steps[i].images[fileIndex+1] = link;
      });
    });
  }

  onSubmit()  {
    for (let step of this.steps) {
      // @ts-ignore
      step.images = step.images.slice(1);
    }
    let submittedGuide = new Guide (this.title, this.author, this.category, this.steps);
    let entry = {
      gid: submittedGuide.gid,
      title: submittedGuide.title,
      author: submittedGuide.author,
      rating: submittedGuide.rating,
      totalRating: submittedGuide.totalRating,
      category: submittedGuide.category,
      creationDate: submittedGuide.creationDate,
      contents: submittedGuide.contents,
      comments: submittedGuide.comments,
    };
    this.fbs.db.collection('guides').add(entry).then(docRef => {
      this.alg.addGuideToIndex(entry);
      this.router.navigate(['guide/' + submittedGuide.gid]);
    });
  }

}
