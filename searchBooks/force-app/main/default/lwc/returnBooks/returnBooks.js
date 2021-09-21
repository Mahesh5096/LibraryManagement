import { LightningElement,wire } from 'lwc';
import getBorrowedBooksByUser from '@salesforce/apex/customSearchSobjectLWC.getBorrowedBooksByUser';
import insertBorrowedBooks from '@salesforce/apex/customSearchSobjectLWC.insertBorrowedBooks';
import updateBook from '@salesforce/apex/customSearchSobjectLWC.updateBook';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import { getRecord } from 'lightning/uiRecordApi';
import USER_NAME from '@salesforce/schema/User.Name';
import USER_ID from '@salesforce/user/Id';


const columns = [
    {label: 'Id', fieldName: 'Id', type: 'text', sortable: "true"},
    {label: 'Book Id', fieldName: 'Name', type: 'text', sortable: "true"},
    {label: 'Book Name', fieldName: 'Book_Name__c', type: 'text', sortable:true, initialWidth: 400},
    {label: 'Book Status', fieldName: 'Book_Status__c', type: 'text', sortable: "true"},
    {label: 'Author', fieldName: 'Author__c', type: 'text', sortable: "true"},
    {label: 'Return date', fieldName: 'Return_date__c', type: 'text', sortable: "true"},
    {label: 'Borrowed date', fieldName: 'Borrowed_Date__c', type: 'text', sortable: "true"}
];

export default class ReturnBooks extends LightningElement {
    bookId;
    BorrowId;
    Author;
    BookName;
    borrowedBy;
    loggedInUserId=USER_ID;
    loggedInUserName;
    columns = columns;
    record=[];
    recordLength=0;
    error;
    data;
    selectedRowId;
    isRowSelected=false;
    BookStatus;
    wireddataResult=[];

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

    @wire(getBorrowedBooksByUser,{userId:'$loggedInUserId'}) wiredBooks(result){
        this.wireddataResult = result;
        if(result.data){
            this.record = result.data;
            this.error=undefined;
            this.recordLength = this.record.length;
        }else if(result.error){
            this.error = result.error;
            console.log(this.error);
        }
        return refreshApex(this.wireddataResult);
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

    showErrorToastForNotSelect() {
        const evt = new ShowToastEvent({
            title: 'Error',
            message: 'Please select any books',
            variant: 'error',
            mode: 'dismissable'
        });
        this.dispatchEvent(evt);
    }

    updateRecord(){
        updateBook({
                id:this.selectedRowId,
                bookStatus:this.BookStatus,
                borrowerId:this.loggedInUserId
            })
            .then(result => {
                console.log(this.loggedInUserId)
                refreshApex(this.wireddataResult); 
            })
            .catch(error=>{
                this.error = error.message;
                console.log(this.error);
            }
        );
    }

    insertAndUpdateBorrowedBooks(){
        console.log('--->called');
        console.log(this.bookId);
        console.log(this.BookStatus);
        insertBorrowedBooks({
            bid:this.BorrowId,
            // bookId: this.bookId,
            // bookName: this.BookName,
            // author: this.Author ,
            bookStatus: this.BookStatus
            // userId: this.loggedInUserId
        })
        .then(result =>{
            console.log('--->borrowedbook'+ result);
        })
        .catch(error=>{
            console.log('erroresssss');
            console.log(error);
            this.error = error.message;
            console.log(this.error);
        })
    }

    handleRowSlect(event){
        if (event.detail.selectedRows.length > 0){
        this.selectedRowId = event.detail.selectedRows[0].Id;
        this.BorrowId = event.detail.selectedRows[0].Name;
        console.log('---> handle row select'+this.selectedRowId);
        this.BookStatus = event.detail.selectedRows[0].Book_Status__c;
        this.bookId = event.detail.selectedRows[0].Name;
        this.BookName = event.detail.selectedRows[0].Book_Name__c;
        this.Author = event.detail.selectedRows[0].Author__c
        this.borrowedBy = event.detail.selectedRows[0].Borrowed_Id__c;
        this.isRowSelected = true;  
        }
    }

    handleReturnClick(){
        if(this.isRowSelected===false){
            this.showErrorToastForNotSelect();
        }
        else{
            this.updateRecord();
            this.insertAndUpdateBorrowedBooks();
            this.showSuccessToastForReturned();
        }
    }

}