#include <iostream>
#include <vector>
#include <queue>
#include <cmath>
#include <algorithm>
#include <climits>
#include <nlohmann/json.hpp>

using namespace std;
using json = nlohmann::json;

struct Node {
    int x, y;
    int g;
    int f;

    bool operator>(const Node& other) const {
        return f > other.f;
    }
};

int heuristic(int x1, int y1, int x2, int y2) {
    return abs(x1 - x2) + abs(y1 - y2);
}

vector<vector<int>> findpath(int starti, int startj, int endi, int endj,
                            vector<vector<int>>& grid) {

    int n = grid.size();
    int m = grid[0].size();

    vector<vector<int>> dist(n, vector<int>(m, INT_MAX));
    vector<vector<pair<int,int>>> parent(n, vector<pair<int,int>>(m, {-1,-1}));

    priority_queue<Node, vector<Node>, greater<Node>> pq;

    dist[starti][startj] = 0;

    pq.push({starti, startj, 0,
             heuristic(starti, startj, endi, endj)});

    vector<pair<int,int>> direction = {
        {0,1},{0,-1},{1,0},{-1,0}
    };

    while(!pq.empty()) {
        Node curr = pq.top(); pq.pop();

        int x = curr.x;
        int y = curr.y;

        if (curr.g > dist[x][y]) continue;

        for (auto [dx, dy] : direction) {
            int nx = x + dx;
            int ny = y + dy;

            if (nx < 0 || ny < 0 || nx >= n || ny >= m) continue;
            if (grid[nx][ny] == 1) continue;

            int new_g = curr.g + 1;

            if (new_g < dist[nx][ny]) {
                dist[nx][ny] = new_g;
                parent[nx][ny] = {x, y};

                int f = new_g + heuristic(nx, ny, endi, endj);
                pq.push({nx, ny, new_g, f});
            }
        }
    }

    // 🔥 while 끝난 후 경로 생성
    vector<vector<int>> path;

    int cx = endi, cy = endj;

    while (cx != -1 && cy != -1) {
        path.push_back({cx, cy});
        auto p = parent[cx][cy];
        cx = p.first;
        cy = p.second;
    }

    reverse(path.begin(), path.end());

    return path;
}

int main() {

    // 🔥 JSON 입력 (테스트용)
    json input;
    cin >> input;

    int sx = input["start"][0];
    int sy = input["start"][1];
    int ex = input["end"][0];
    int ey = input["end"][1];

    vector<vector<int>> grid = input["grid"];

    // A* 실행
    vector<vector<int>> path = findpath(sx, sy, ex, ey, grid);

    // JSON 출력
    json output;
    output["path"] = path;

    cout << output.dump() << endl;

    return 0;
}