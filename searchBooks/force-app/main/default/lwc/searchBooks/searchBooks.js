import { LightningElement,wire } from 'lwc';
import getBookById from '@salesforce/apex/customSearchSobjectLWC.getBookById';
//import getBooks from '@salesforce/apex/customSearchSobjectLWC.getBooks';
import insertBorrowedBooks from '@salesforce/apex/customSearchSobjectLWC.insertBorrowedBooks';
import updateBook from '@salesforce/apex/customSearchSobjectLWC.updateBook';
import getBorrowedCount from '@salesforce/apex/customSearchSobjectLWC.getBorrowedCount';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import { getRecord } from 'lightning/uiRecordApi';
import USER_NAME from '@salesforce/schema/User.Name';
import USER_ID from '@salesforce/user/Id';

const columns = [
    {label: 'Book Id', fieldName: 'Name', type: 'text', sortable: "true"},
    {label: 'Book Name', fieldName: 'Book_Name__c', type: 'text', sortable:true, initialWidth: 400},
    {label: 'Book Status', fieldName: 'Book_Status__c', type: 'text', sortable: "true"},
    {label: 'Author', fieldName: 'Author__c', type: 'text', sortable: "true"},
    {label: 'Category', fieldName: 'Category__c', type: 'text', sortable: "true"},
    {label: 'Genres', fieldName: 'Genres__c', type: 'text', sortable: "true"},
    {label: 'Member Id', fieldName: 'Borrowed_Id__c', type: 'text', sortable: "true"},
    {label: 'Return date', fieldName: 'Return_date__c', type: 'text', sortable: "true"},
    {label: 'Borrowed date', fieldName: 'Borrowed_Date__c', type: 'text', sortable: "true"}
];

export default class SearchBooks extends LightningElement {

    //for member login
    get options() {
        return [
            { label: 'Id', value: 'Name' },
            { label: 'Author', value: 'Author__c' },
            { label: 'Name', value: 'Book_Name__c' },
            { label: 'Genres', value: 'Genres__c' },
        ];
    }

    //for librarian login
    get options1(){
        return[
            { label: 'Id', value: 'Name' },
            { label: 'Author', value: 'Author__c' },
            { label: 'Name', value: 'Book_Name__c' },
            { label: 'Genres', value: 'Genres__c' },
            { label: 'Members', value: 'Borrowed_Id__c' },
        ]
    }

//#region reactive variables
    bookId;
    Author;
    BookName;
    borrowedBy;
    loggedInUserId=USER_ID;
    loggedInUserName;
    columns = columns;
    record;
    recordLength = 0;
    searchValue = '';
    error;
    data;
    value = null;
    sortDirection;
    sortBy;
    selectedRowId;
    isRowSelected=false;
    BookStatus;
    wireddataResult;
    borrowedCount;
    wiredBorrowedCountResult;
    isLibrarin=false;

//#endregion

//#region Get logged in user details
    @wire(getRecord, {
        recordId: USER_ID,
        fields: [USER_NAME]
    }) wireuser({
        error,
        data
    }) {
        if (error) {
           this.error = error ;
           console.log(this.error);
            
        } else if (data) {
            this.loggedInUserName = data.fields.Name.value;
        }
    }
//#endregion

//#region Get the Books using refresh apex
    @wire(getBookById,{searchBy:'$value',searchKey:'$searchValue'}) wiredBooks(result){
        this.wireddataResult = result;
        console.log(result.data);
        if(result.data){
            this.record = result.data;
            this.recordLength = this.record.length;
        }
        return refreshApex(this.wireddataResult);
    }
//#endregion

get dynamicGreetings(){
    if(this.loggedInUserName!=undefined){
        return `Hello ${this.loggedInUserName.toUpperCase()}!`;
    }
}

//#region Success Toast 
    showSuccessToastForBorrowed() {
        const event = new ShowToastEvent({
            title: 'Borrow Success',
            message: 'Successfully borrowed a book',
            variant: 'success',
            mode: 'dismissable'
        });
        this.dispatchEvent(event);
    }

    showSuccessToastForReturned() {
        const event = new ShowToastEvent({
            title: 'Return Success',
            message: 'Successfully Returned a book',
            variant: 'success',
            mode: 'dismissable'
        });
        this.dispatchEvent(event);
    }

//#endregion

//#region Error Toast

    showErrorToastForChooseByField() {
        const evt = new ShowToastEvent({
            title: 'Error',
            message: 'Please choose serach by field',
            variant: 'error',
            mode: 'dismissable'
        });
        this.dispatchEvent(evt);
    }

    showErrorToastForBorrowedCount() {
        const evt = new ShowToastEvent({
            title: 'Error',
            message: "You can't borrow more than 3 books, Please return the borrowed books to borrow new books",
            variant: 'error',
            mode: 'dismissable'
        });
        this.dispatchEvent(evt);
    }

    showErrorToastForBorrowed() {
        const evt = new ShowToastEvent({
            title: 'Error',
            message: 'Chosen book is already borrowed, Please choose different book',
            variant: 'error',
            mode: 'dismissable'
        });
        this.dispatchEvent(evt);
    }

    showErrorToastForWrongReturn() {
        const evt = new ShowToastEvent({
            title: 'Error',
            message: 'Only borrowed member should return the book',
            variant: 'error',
            mode: 'dismissable'
        });
        this.dispatchEvent(evt);
    }

    showErrorToastForAvailabe() {
        const evt = new ShowToastEvent({
            title: 'Error',
            message: 'You can only return borrowed books',
            variant: 'error',
            mode: 'dismissable'
        });
        this.dispatchEvent(evt);
    }

    showErrorToastForNotSelect() {
        const evt = new ShowToastEvent({
            title: 'Error',
            message: 'Please select any books',
            variant: 'error',
            mode: 'dismissable'
        });
        this.dispatchEvent(evt);
    }

//#endregion
    
//#region Update books ,getborrowedbookscount and insertandUpdateBorrowedBooks  method
    updateRecord(){
        updateBook({
                id:this.selectedRowId,
                bookStatus:this.BookStatus,
                borrowerId:this.loggedInUserId
            })
            .then(result => {
                console.log(this.loggedInUserId)
                return refreshApex(this.wireddataResult);  
            })
            .catch(error=>{
                this.error = error.message;
                console.log(this.error);
            }
        );
    }

    insertAndUpdateBorrowedBooks(){
        insertBorrowedBooks({
            bookId: this.bookId,
            bookName: this.BookName,
            author: this.Author ,
            bookStatus: this.BookStatus,
            userId: this.loggedInUserId
        })
        .then(result =>{
            console.log('--->borrowedbook'+result);
        })
        .catch(error=>{
            console.log('---->errorers serach'+error);
            this.error = error.message;
            console.log(this.error);
        })

    }

    getBorrowedBooksCount(){
        getBorrowedCount({
            borrowId: this.loggedInUserId
        })
        .then(result=>{
            this.borrowedCount = result;
            console.log(this.borrowedCount);
        })
        .catch(error=>{
            this.error = error.message;
            console.log(this.error);
        });
    }
//#endregion

//#region Handle methods
    handleChange(event){
        this.value = event.target.value;
    }

    handleSearch(event){
        //this.searchValue = event.target.value;
        if(this.value===null){
            this.showErrorToastForChooseByField();   
        }
        else{

            window.clearTimeout(this.delayTimeout);
            const searchKey = event.target.value;
            this.delayTimeout = setTimeout(() => {
                this.searchValue = searchKey;
            }, 300);
        }
    }

    handleRowSlect(event){
       this.selectedRowId = event.detail.selectedRows[0].Id;
       this.BookStatus = event.detail.selectedRows[0].Book_Status__c;
       this.bookId = event.detail.selectedRows[0].Name;
       this.BookName = event.detail.selectedRows[0].Book_Name__c;
       this.Author = event.detail.selectedRows[0].Author__c
       this.borrowedBy = event.detail.selectedRows[0].Borrowed_Id__c;
       this.isRowSelected = true; 
    }

    handleBorrowClick(){
        if(this.isRowSelected===false){
            this.showErrorToastForNotSelect();
        }
        if(this.BookStatus==='Borrowed'){
            this.showErrorToastForBorrowed();
        }
        if(this.BookStatus==='Available'){
            if(this.borrowedCount<3){
                this.updateRecord();
                this.insertAndUpdateBorrowedBooks();
                this.showSuccessToastForBorrowed();
                this.borrowedCount += 1;
            }else{
                this.showErrorToastForBorrowedCount();
            }
        }
    }

    handleReturnClick(){
        if(this.isRowSelected===false){
            this.showErrorToastForNotSelect();
        }
        if(this.BookStatus==='Available'){
            this.showErrorToastForAvailabe();
        }
        if(this.BookStatus==='Borrowed'){
            if(this.borrowedBy===this.loggedInUserId){
                this.updateRecord();
                this.insertAndUpdateBorrowedBooks();
                this.showSuccessToastForReturned();
                this.borrowedCount -= 1; 
            }else{
                this.showErrorToastForWrongReturn();
            }          
        }
    }
//#endregion

//#region Methods for sorting
    doSorting(event){
        this.sortBy = event.detail.fieldName;
        this.sortDirection = event.detail.sortDirection;
        this.sortData(this.sortBy,this.sortDirection);
    }

    sortData(fieldName,direction){
        let parseDate = JSON.parse(JSON.stringify(this.record));
        let keyValue = (a) =>{
            return a[fieldName];
        };

        let isReverse = direction ==='asc'?1:-1;
        parseDate.sort((x,y)=>{
            x = keyValue(x)?keyValue(x):'';
            y = keyValue(y)?keyValue(y):'';
            return isReverse*((x>y)-(y>x));
        });
        this.record = parseDate;
        this.recordLength = this.record.length;
    }
//#endregion

    connectedCallback(){
        this.getBorrowedBooksCount();
        if(this.loggedInUserId==='0055g00000AoQaDAAV'){
            this.isLibrarin=true;
        }
    }
}

//#region commended lines

// getBookById({
            //     searchBy:this.value,
            //     searchKey: this.searchValue
            // })
            // .then(result => {
            //     this.record = result;
            //     this.recordLength = this.record.length;
            // })
            // .catch(error=>{
            //     this.error = error.message;
            //     console.log(this.error);
            // });
 // getBooks()
        // .then(result =>{
        //     this.record = result;
        //     this.recordLength = this.record.length;
        // })

//#endregion