import express from 'express';
import { testOperations } from './operations';
import { testVersioning } from './versioning';

//2. Document versioning

testVersioning()

//5. BONUS - Operations
//check src/operations.ts

testOperations()



//3. Node.js REST API

export enum ExportFileTypes {
  pdf = 'pdf',
  epub = 'epub',
}

export enum ImportFileTypes {
  pdf = 'pdf',
  word = 'word',
  wattpad = 'wattpad',
  evernote = 'evernote',
}

export class ImportJob {
  bookId: string;
  type: ImportFileTypes;
  url: string;
  state: string;
  updated_at: Date;
  created_at: Date;

  constructor(bookId: string, type: ImportFileTypes, url: string) {
    this.bookId = bookId;
    if (!Object.keys(ImportFileTypes).includes(type)) {
      throw Error('Invalid file type');
    }
    this.type = type;
    this.url = url;

    this.state = 'pending';
    this.updated_at = new Date();
    this.created_at = new Date();

    console.log(
      'New import job for book ' +
        this.bookId +
        ' of type ' +
        this.type +
        ' from ' +
        this.url
    );
  }

  start() {
    let processing_time = 0;
    switch (this.type) {
      case 'pdf':
        processing_time = 25 * 1000;
        break;
      default:
        processing_time = 60 * 1000;
    }

    setTimeout(() => {
      this.state = 'finished';
      this.updated_at = new Date();
    }, processing_time);
  }
}

export class ExportJob {
  id: number;
  bookId: string;
  type: ExportFileTypes;
  state: string;
  updated_at: Date;
  created_at: Date;

  constructor(bookId: string, type: ExportFileTypes) {
    this.id = export_jobs.size + 1;
    this.bookId = bookId;
    //we throw an error if the filetype doesn't match our requirements at runtime
    if (!Object.keys(ExportFileTypes).includes(type)) {
      throw Error('Invalid file type');
    }
    this.type = type;

    this.state = 'pending';
    this.updated_at = new Date();
    this.created_at = new Date();

    console.log(
      'New export job for book ' + this.bookId + ' of type ' + this.type
    );
  }

  start() {
    let processing_time = 0;
    switch (this.type) {
      case 'epub':
        processing_time = 10 * 1000;
        break;
      case 'pdf':
        processing_time = 25 * 1000;
        break;
      default:
        processing_time = 60 * 1000;
    }

    setTimeout(() => {
      this.state = 'finished';
      this.updated_at = new Date();
      console.log(this);
    }, processing_time);
  }
}

const app = express();

app.use(express.json());

//to track individual export jobs
var export_jobs: Map<number, ExportJob> = new Map<number, ExportJob>();

//basic array implementation, can't identify each job
var import_jobs: Array<ImportJob> = [];

//thanks to the map, we can implement this new handler and track the state of individual jobs
app.get('/export/:id', function (req, res) {
  let resp = export_jobs.get(Number(req.params.id));
  if (!resp) {
    throw Error('Export job not found for id: ' + req.params.id);
  }
  res.json(resp);
});

//I assume by 'grouped by state', 2 different arrays are supposed to be returned as a response? 
app.get('/export', function (req, res) {
  let resp;
  let pending = Array.from(export_jobs.values()).filter(
    (item) => item.state == 'pending'
  );
  let finished = Array.from(export_jobs.values()).filter(
    (item) => item.state == 'finished'
  );
  resp = { pending, finished };
  res.json(resp);
});

//Or we can separate into different handlers?
app.get('/finished_exports', function (req, res) {
  let resp;
  let finished = Array.from(export_jobs.values()).filter(
    (item) => item.state == 'finished'
  );
  resp = finished;
  res.json(resp);
});

app.post('/export', function (req, res) {
  let job = new ExportJob(req.body.bookId, req.body.type);
  job.start();
  export_jobs.set(job.id, job);
  let resp = 'Export job started';
  res.json(resp);
});

app.get('/import', function (req, res) {
  let pending = import_jobs.filter((item) => item.state == 'pending');
  let finished = import_jobs.filter((item) => item.state == 'finished');
  let resp = { pending, finished };
  res.json(resp);
});

app.post('/import', function (req, res) {
  let job = new ImportJob(req.body.bookId, req.body.type, req.body.url);
  job.start();
  import_jobs.push(job);
  let resp = 'Import job started';
  res.json(resp);
});

app.listen(9001, () => {
  console.log('Node.js API running on port 9001');
});
