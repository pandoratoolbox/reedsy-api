import diff_match_patch, {
  Diff,
  patch_obj,
  DIFF_EQUAL,
  DIFF_INSERT,
  DIFF_DELETE,
} from './diff_match_patch';


var dmp = new diff_match_patch();
var doc_count = 0;

const { deflateSync, unzipSync } = require('zlib');


//We'll leave this for another time
function lcsLength(a: string, b: string) {
  let s = 0;
  let c: Array<Array<number>> = [];
  //init length matrix
  for (let i = 0; i < a.length; i++) {
    c[i][0] = 0;
  }

  for (let j = 0; j < b.length; j++) {
    c[0][j] = 0;
  }

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] == b[j - 1]) {
        c[i][j] = c[i - 1][j - 1] + 1;
      } else {
        c[i][j] = Math.max(c[i][j - 1], c[i - 1][j]);
      }
    }
  }

  return c;
}



export class Document {
  id: number;
  text: Buffer;
  version: number;
  original_version_id: number | undefined;
  created_at: Date | undefined;

  constructor(data: Partial<Document>) {
    this.id = data.id ? data.id : 1;
    this.text =  data.text ? deflateSync(data.text) : deflateSync('');
    this.version = data.version ? data.version : 1;
    this.original_version_id = data.original_version_id;
    this.created_at = data.created_at;
  }

  read() {
    let target_id = this.id;

    if (this.original_version_id) {
      target_id = this.original_version_id;
    }

    let omap = document_map.get(target_id);

    let oray = Array.from(omap?.values() ?? []);
    let v_text = '';
    for (let o = 0; o < this.version; o++) {
      if (o == 0) {
        v_text =  unzipSync(oray[o].text).toString();
        continue;
      }

      v_text = combine(v_text,  unzipSync(oray[o].text).toString());
    }

    return v_text
  }

  update(upd: string) {
    let updated: Document = new Document({});
    if (this.original_version_id) {
      //compare combination of text from previous versions with new text, only save the difference to preserve disk space (Google Doc's diff_match_patch format)
      let omap = document_map.get(this.original_version_id);
      let oray = Array.from(omap?.values() ?? []);
      let v_text = '';
      for (let o = 0; o < oray.length; o++) {
        if (o == 0) {
          v_text = unzipSync(oray[o].text).toString()
          continue;
        }

        let processed =  unzipSync(oray[o].text).toString()
        v_text = combine(v_text, processed);
      }

      updated.setText(difference(v_text, upd));
      //   updated.text = difference(omap?.get(1)?.text ?? '', upd); //this saved the difference from the original version, it's faster to save/retrieve but takes up more disk space
      updated.original_version_id = this.original_version_id;
      //increment version of new document
      updated.version = this.version + 1;
    } else {
      //compare current text (there are no other versions) to new text and save the different to version 2
      updated.setText(difference(this.text.toString('base64'), upd));
      //updated.previous_version_id = this.id
      updated.original_version_id = this.id;
      //new document version must be 2, if current document has no previous versions (implies current version is 1)
      updated.version = 2;
    }
    updated.commit();
  }

  setText(input: string) {
    this.text = deflateSync(input)
  }

  readText() {
    return unzipSync(this.text).toString()
  }

  commit() {
    doc_count++;
    this.id = doc_count;
    if (!this.created_at) {
      this.created_at = new Date();
    }
    if (this.original_version_id) {
      let target = document_map.get(this.original_version_id);
      if (target) {
        //new versioned document entry
        target.set(this.version, this);
      } else {
        throw Error('Parent document not found');
      }
    } else {
      //new original document entry
      document_map.set(this.id, new Map<number, Document>().set(1, this));
    }
  }
}

function difference(text1: string, text2: string) {
  let diff = dmp.diff_main(text1, text2, false);
  if (diff.length > 2) {
    dmp.diff_cleanupSemantic(diff);
  }
  let patches = dmp.patch_make(text1, text2, diff);
  return dmp.patch_toText(patches);
}

function combine(original: string, versioned_text: string) {
  let patch_list = dmp.patch_fromText(versioned_text);
  let result = dmp.patch_apply(patch_list, original);
  return <string>result[0];
}

//original document id, document versions
var document_map: Map<number, Map<number, Document>> = new Map<
  number,
  Map<number, Document>
>();

function getLatestDocumentVersion(parent_id: number) {
  let vmap = document_map.get(parent_id);
  if (vmap) {
    let n = Array.from(vmap.values()).pop();
    if (n) {
      return n;
    } else {
      throw Error('Document not found, somehow');
    }
  } else {
    throw Error('Parent document not found');
  }
}

function getDocumentVersion(parent_id: number, version: number) {
  let vmap = document_map.get(parent_id);
  if (vmap) {
    let doc = vmap.get(version);
    if (doc) {
      return doc;
    } else {
      throw Error('Versioned document not found');
    }
  } else {
    throw Error('Parent document not found');
  }
}

export function testVersioning() {
  let test = new Document({})
  test.setText('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque non tempor risus. Quisque ut dictum nunc, at cursus dolor. Vestibulum ut nibh venenatis, luctus eros ac, porttitor ex. Vestibulum tempor tortor eu justo porttitor, sit amet faucibus erat porttitor. Pellentesque id magna sed ex feugiat viverra. Ut laoreet lacinia felis non dignissim. Fusce hendrerit orci ac tortor consequat pulvinar. Suspendisse a varius orci. Praesent rutrum arcu a massa tempor lacinia. Aliquam interdum velit sed lorem dignissim aliquet. Maecenas efficitur sem eget dui aliquam, sed aliquet magna bibendum. Sed sapien ex, sodales nec pellentesque ac, vestibulum sit amet nunc. Nullam sagittis ultricies velit, sit amet iaculis eros. Aliquam efficitur facilisis sapien, vel sodales ligula porta sit amet.');
  //save document 1
  test.commit();
  //update document 1, adds version 2
  test.update(
    'Change this, but this is still here. Pellentesque non tempor risus. Quisque ut dictum nunc, at cursus dolor. Vestibulum ut nibh venenatis, luctus eros ac, porttitor ex. Vestibulum tempor tortor eu justo porttitor, sit amet faucibus erat porttitor. Pellentesque id magna sed ex feugiat viverra. Ut laoreet lacinia felis non dignissim. Fusce hendrerit orci ac tortor consequat pulvinar. Suspendisse a varius orci. Praesent rutrum arcu a massa tempor lacinia. Aliquam interdum velit sed lorem dignissim aliquet. Maecenas efficitur sem eget dui aliquam, sed aliquet magna bibendum. Sed sapien ex, lets change this part. Nullam sagittis ultricies velit, sit amet iaculis eros. Aliquam efficitur facilisis sapien, vel sodales ligula porta sit amet.'
  );
  let d_map = document_map.get(test.id);
  //get then update version 2 of document 1, adds version 3
  d_map
    ?.get(2)
    ?.update(
      'Now its gone, but this is still here. Pellentesque non tempor risus. Quisque ut dictum nunc, at cursus dolor. Vestibulum ut nibh venenatis, luctus eros ac, porttitor ex. Vestibulum tempor tortor eu justo porttitor, sit amet faucibus erat porttitor. Pellentesque id magna sed ex feugiat viverra. Ut laoreet lacinia felis non dignissim. Fusce hendrerit orci ac tortor consequat pulvinar. Suspendisse a varius orci. Praesent rutrum arcu a massa tempor lacinia. Aliquam interdum velit sed lorem dignissim aliquet. Maecenas efficitur sem eget dui aliquam, sed aliquet magna bibendum. Sed sapien ex, lets change this part. Nullam sagittis ultricies velit, sit amet iaculis eros. deleted'
    );

  //view our document-version map so far
  console.log(document_map.get(test.id));

  //all versions of document 1
  let omap = document_map.get(1);

  //let's see what happens when we read version 1 & 3
  console.log(omap?.get(1)?.read());
  console.log(omap?.get(3)?.read());

  let doc2 = new Document({})
  doc2.setText('Pretty good?')
  doc2.commit()
  doc2.update("Could be better if we had more time")

  console.log(document_map)
  console.log("Now our document versioning system is complete and ready to work with. (Including compression optimizations)")
}
