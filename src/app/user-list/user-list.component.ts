import { Component, OnInit } from '@angular/core';
import {Apollo, QueryRef} from 'apollo-angular';
import {Observable} from 'rxjs';
import {queryGraphql} from '../graphql/query.graphql';
import {subscriptionGraphql} from '../graphql/subscription.graphql';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss'],
})
export class UserListComponent implements OnInit {

  usersQuery: QueryRef<any>;

  // todo:
  // fetch user list, live update if new user create.
  users: Observable<any>;
  constructor(private apollo: Apollo) {
    this.usersQuery = apollo.watchQuery({
      query: queryGraphql.users
    });
    this.users = this.usersQuery.valueChanges;
  }

  ngOnInit() {
    this.usersQuery.subscribeToMore({
      document: subscriptionGraphql.newUserEvent,
      updateQuery: (prev, {subscriptionData}) => {
        if (!subscriptionData.data) {
          return prev;
        }
        return {
          ...prev,
          // @ts-ignore
          users: [subscriptionData.data.newUserEvent, ...prev.users]
        };
      }
    });
  }

}
