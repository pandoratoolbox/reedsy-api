export class Author {
  id: number | undefined;
  first_name: string | undefined;
  last_name: string | undefined;
  book: Book | undefined;


  constructor(data: Partial<Author>) {
    this.id = data.id;
    this.first_name = data.first_name;
    this.last_name = data.last_name;
    this.book = data.book ? new Book(<Book>data.book) : undefined;


  }
}

export class Book {
  id: number | undefined;
  title: string | undefined;
  state: string;

  constructor(data: Partial<Book>) {
    this.id = data.id;
    this.title = data.title;
    this.state = "pending"
  }
}

//allow embeddable + nullable classes working during runtime
// let test = new Author({
//   id: 999,
//   first_name: '',
//   book: { id: 0, title: 'Book title' },
// });

// console.log(test);