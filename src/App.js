import React, { Component } from 'react';
import {
  Text,Platform,
  View, AsyncStorage,
  Button, FlatList, ActivityIndicator
} from 'react-native';
import SSC from 'sscjs';
import HolderListItem from './View/HolderListItem';
import steemController from './Steem/steemController'
import steemConnect from './Steem/steemConnect';

var sc = new steemController();

class App extends Component {
    state = {
        holders: [],
        symbol: '',
        maintainer: ['virus707', 'goldenticket', 'jjm13'],
        sum_balance:'',
        holderCnt:0, holderAll:0,
        updated: true, watingListUpdate: false, getPostingFromDate: 7,
        modalVisible: false,
        sign_in: false,

    }

    getWatingList = () => {
        // update holders link and voted
        this.setState({holderCnt:0, updated:false})
        var holder_id = 0;
        var dt = new Date();  
        dt.setDate(dt.getDate() - this.state.getPostingFromDate);
        var startDate = dt.toISOString().split('.')[0];
        var show_dt = dt.toLocaleString();
        var tHolders = this.state.holders_data
        
        this.setState({holderAll:tHolders.length, show_dt})
        for (const holder of tHolders) {
            this.getPostingByBlog(holder.account,'','',this, holder_id, tHolders, startDate, 0);
            holder_id = holder_id +1;
        }        
    }

    filtering = () => {

        var holders = this.state.holders_data;
        this.setState({updated:false, holders_data:[]},
            () => {
                window.alert('updated!');
                holders = holders.filter(item => item.voted !== true)
                holders = holders.filter(item => item.latest_posting_jjm !== "")
                holders = holders.filter(item => item.balance !== "0 JJM")
                // holders.sort(function(x, y) {
                //     return (x.voted === y.voted)? 0 : x.voted? 1 : -1;
                // });

                console.log(holders);
                this.setState({updated:true,holders_data:holders, watingListUpdate:true})
            })
    }    

    updatedCallback(holders){
        var cnt = this.state.holderCnt;
        cnt = cnt + 1;
        this.setState({holderCnt:cnt})
        if(cnt === this.state.holderAll)
        {
            console.log(holders);
            this.setState({
                holders_data:holders,
                updated:true
            }, 
            () => {
                // window.alert('updated!');
                this.filtering();
                  }
            );
        }
    }

    votedReculsive(list, index,length,that){
        steemConnect.vote(that.state.steem_account,list[index].account, list[index].latest_posting_jjm, list[index].voting_rate*100, function(err,res){
            console.log('index',index, list[index].account);
            console.log(err,res);
            index = index + 1;
            if(index === length){
                that.setState({updated:true})
                window.alert('updated!');
                return;
            }
            that.votedReculsive(list,index,length,that);
        })
    }

    actionVoting = () => {
        var holders = this.state.holders_data;
        this.setState({updated:false, watingListUpdate:false},()=>{
            this.votedReculsive(holders,0,holders.length,this);
        })
    }

    render() {
        return (

        <View style={{flex: 1,}}>
            <View style={{flex: 1, flexDirection: 'row', width:500, paddingLeft: 20, paddingTop: 20}}>
                {this.state.updated === true? <View/> :<ActivityIndicator size="large" color="#0000ff" />}
                <View style={{flex: 1,paddingRight:10}}>
                    <Button style={{}} title='Waiting list' disabled={this.state.updated === true? false:true} onPress={this.getWatingList}/>
                </View>
                <View style={{flex: 1,paddingRight:10}}>
                    <Button style={{}} title='Voting' disabled={this.state.watingListUpdate === true? false:true} onPress={this.actionVoting}/>
                </View>
                <View style={{flex: 1,}}>
                    <Button style={{}} title={this.state.sign_in === false? 'Sign in with SteemConnect':'Sign out'} onPress={this.loginSteemConnect2}/>
                </View>
            </View>
            <Text style={{color: 'black', fontWeight: 'bold', fontSize: 20, paddingLeft: 20, paddingTop: 20, paddingBottom:3}}>Token Info</Text>
            <Text style={{color: 'black', fontSize: 15, paddingLeft: 20, paddingBottom: 5}}>Last: {this.state.lastPrice} STEEM, 24h Vol: {this.state.volume} STEEM, Bid: {this.state.highestBid} STEEM, Ask: {this.state.lowestAsk} STEEM</Text>
            <Text style={{color: 'black', fontWeight: 'bold', fontSize: 16, paddingLeft: 20, paddingBottom: 3}}>총 홀더 수 : {this.state.holders.length}</Text>
            <Text style={{color: 'black', fontWeight: 'bold', fontSize: 16, paddingLeft: 20}}>유통물량 : {(this.state.sum_balance*1).toFixed(2)} JJM</Text>
            <View style={{flex: 1, flexDirection: 'row', paddingTop: 30, paddingLeft: 20}}>
            <Text style={{flex: 1, color: 'black', fontWeight: 'bold', fontSize: 20, padding: 3}}>Account</Text>
            <Text style={{flex: 1, color: 'black', fontWeight: 'bold', fontSize: 20, padding: 3}}>Balance</Text>
            <Text style={{flex: 0.5,color: 'black', fontWeight: 'bold', fontSize: 20, padding: 3}}>Stake</Text>
            <Text style={{flex: 0.5,color: 'black', fontWeight: 'bold', fontSize: 20, padding: 3}}>Voting Percent</Text>
            <Text style={{flex: 0.5,color: 'black', fontWeight: 'bold', fontSize: 20, padding: 3}}>Voted after {this.state.show_dt}</Text>
            <Text style={{flex: 1,color: 'black', fontWeight: 'bold', fontSize: 20, padding: 3}}>Latest link</Text>
            </View>
            <View style={{flex: 1, paddingLeft: 20}}>
            <FlatList
                data= {this.state.holders_data}
                extraData={this.state.updated}
                renderItem={({item}) => <HolderListItem id={item.id} account ={item.account} balance = {item.balance} voting_rate = {item.voting_rate}
                rate = {item.rate} holderID = {item.hid} voted = {item.voted} latestLink ={'https://busy.org/@'+item.account+'/'+item.latest_posting_jjm}/>}
                />
            </View>
        </View>

        )
    }



    sscLoad = (symbol= 'JJM') =>{
        const ssc = new SSC('https://api.steem-engine.com/rpc/');
        ssc.stream((err, res) => {
        });
    
        ssc.find('market', 'metrics', {'symbol':symbol}, 1000, 0, [], (err, result) => {
          this.setState({
            lastPrice: result[0].lastPrice,
            volume: result[0].volume,
            highestBid: result[0].highestBid,
            lowestAsk: result[0].lowestAsk
          });
        });
    
    
        ssc.find('tokens', 'balances', {'symbol':symbol}, 1000, 0, [], (err, result) => {
          var tHolders = []
          var tData = []
    
          result.sort(function (a,b){
            return b.balance - a.balance;
          });
          for (var holder of result) {
            tHolders.push(holder)
          }
          var sumBalance = 0;
    
          /// add all balances
          for (const holder of tHolders) {
              sumBalance = sumBalance + 1*(holder.balance);
          }
    
          /// remove maintainer balances
          for (const mt of this.state.maintainer) {
            var maintainer = this.findAccount(tHolders,mt);
            if(maintainer !== undefined) 
              sumBalance = sumBalance - maintainer.balance;
          }
          this.setState({sum_balance: sumBalance});
    
          
            /// calculate rate
            var holder_id = 0;
            for (const holder of tHolders) {
                holder_id = holder_id +1;
                holder.rate = holder.balance / sumBalance;
                for (const mt of this.state.maintainer) {
                    if(holder.account === mt) 
                        holder.rate = 0;
                    }
                var voting_rate = 1;
                if(holder.balance/1000 > 45)
                    voting_rate = voting_rate + 45;
                else
                    voting_rate = voting_rate + Math.floor(holder.balance/1000);
                
                
                
                tData.push({account: holder.account, balance: (holder.balance*1)+' '+symbol, rate: (holder.rate*1), 
                            hid:holder_id, voting_rate:voting_rate})
            }
            this.setState({holders: tHolders, holders_data: tData, sum_balance: sumBalance},
                            () => {
                                    // this.onPressButton1();
                                }
                          );
        })
    }

    findAccount = (holders, account) =>
    {
      return holders.find(function(a){return a.account === account;});
    }
  
    componentDidMount(){
      var _symbol = 'JJM'
      this.setState({symbol:_symbol});
      this.sscLoad(_symbol);

      var link = window.location.href;
      this.checkToken(link);
      this.getAsyncToken().then((token) => {
          if(token === null)
          {
              this.setState({sign_in:false});
          }
          else
          {
              // AccessToken 셋팅
              steemConnect.setAccessToken(token);
              // 계정 정보 조회
              steemConnect.me().then(({ account }) => {
                  
                  const { profile }  = JSON.parse(account.json_metadata);
                  console.log('profile', account);
                  this.setState({sign_in:true,steem_account:account.name});
              }).catch(function(e){
              });
          }
      });
    }



    loginSteemConnect2 = () => {
        // Go to Commit screen
        if(this.state.sign_in === false)
            this.getLoginURL();
        else
            this.revokeToken();
    }
        
    getLoginURL = () =>{
        let link = steemConnect.getLoginURL();
        window.location.href = link;
    }

    revokeToken = () =>{
        steemConnect.revokeToken(function (err,res){
            console.log(res);
            AsyncStorage.removeItem('token');
        })
        this.setState({sign_in:false});
    }

    checkToken = (url) => {
        if (url.indexOf('?access_token') > -1) {
          try {
            const tokens = {};
            // 콜백 URL에서 accessToken 정보 추출하기
            let params = url.split('?')[1];
            params = params.split('&');
            params.forEach(e => {
              const [key, val] = e.split('=');
              tokens[key] = val;
            });
            console.log('tokens:', tokens);
            AsyncStorage.setItem('token', tokens.access_token);
          } catch (error) {
            console.log(error);
          }
        }
      };

    getAsyncToken = async () => {
        try {
            const value = await AsyncStorage.getItem('token');
            return await value;
        } catch (e) {
            console.warn(e)
            return null
        }
    };      

    getPostingByBlog(author, start_author= '', start_permlink = '',that, holder_id, holders, startDate, c){
        const size = 50;
        var query = {
            'tag': author,
            'limit': size,
            'start_author': start_author,
            'start_permlink': start_permlink
        };
        sc.getDiscussionsByBlog(query).then(function(response) {
            var length_posts = response.length
            var voted = false;
            var latest_posting_jjm = ''
            for (const post of response) {
                if(post.author === query.tag){
                    if(post.created > startDate){
                        if(voted ===false){
                            voted = post.active_votes.find(function(a){return (a.voter === 'virus707' || a.voter === 'jacobyu')});
                        }
                        if( c === 0){
                            latest_posting_jjm = post.permlink;
                        }
                        if (voted !== undefined)
                            voted = true;
                        else if(voted === undefined)
                            voted = false;
                        c = c + 1;
                    }
               }
            }
            if(length_posts < size || response[length_posts-1].created< startDate){      
                if(holders[holder_id].account === author){
                    holders[holder_id].voted = voted;
                    holders[holder_id].latest_posting_jjm = latest_posting_jjm;
                    that.updatedCallback(holders);
                }
                else{
                    console.log('something is wrong.');
                }
                return;     
            }
            var start_author= response[length_posts-1].author;
            var start_permlink= response[length_posts-1].permlink;
            that.getPostingByBlog(author, start_author, start_permlink,that,holder_id,holders,startDate,c);
        });
    }
}
 

let hotWrapper = () => () => App;
if (Platform.OS === 'web') {
  const { hot } = require('react-hot-loader');
  hotWrapper = hot;
}
export default hotWrapper(module)(App);
