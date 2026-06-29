import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Client, Message, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Observable, Subject } from 'rxjs';
import { STORAGE_KEYS } from '../constants/app.constants';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private stompClient: Client;
  private backendUrl = environment.apiUrl;
  
  private messageSubject = new Subject<any>();
  public messages$ = this.messageSubject.asObservable();
  
  private activeSubscriptions: Map<string, StompSubscription> = new Map();

  constructor(private http: HttpClient) {
    this.stompClient = new Client({
      webSocketFactory: () => new SockJS(`${this.backendUrl}/ws/chat`),
      reconnectDelay: 5000,
      debug: (str) => {
        // console.log(str);
      }
    });

    this.stompClient.onConnect = (frame) => {
      console.log('Connected to STOMP');
    };

    this.stompClient.activate();
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  // REST API
  getMyChats(userId: number, role: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.backendUrl}/api/v1/chats/my-chats?userId=${userId}&role=${role}`, { headers: this.getHeaders() });
  }

  getChatHistory(chatId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.backendUrl}/api/v1/chats/history?chatId=${chatId}`, { headers: this.getHeaders() });
  }

  // STOMP WebSockets
  subscribeToChat(chatId: string) {
    if (!this.stompClient.connected) {
      setTimeout(() => this.subscribeToChat(chatId), 1000);
      return;
    }
    
    if (this.activeSubscriptions.has(chatId)) {
      return; // Already subscribed
    }

    const sub = this.stompClient.subscribe(`/topic/chat/${chatId}`, (message: Message) => {
      if (message.body) {
        this.messageSubject.next(JSON.parse(message.body));
      }
    });
    this.activeSubscriptions.set(chatId, sub);
  }

  unsubscribeFromChat(chatId: string) {
    const sub = this.activeSubscriptions.get(chatId);
    if (sub) {
      sub.unsubscribe();
      this.activeSubscriptions.delete(chatId);
    }
  }

  sendMessage(messageDto: any): Observable<any> {
    return this.http.post<any>(`${this.backendUrl}/api/v1/chats/messages`, messageDto, { headers: this.getHeaders() });
  }
}
