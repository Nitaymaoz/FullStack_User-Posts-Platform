import json

def generate_notes(n):
    notes = []
    for i in range(1, n + 1):
        note = {
            "id": i,
            "title": f"Note {i}",
            "author": {
                "name": f"Author {i}",
                "email": f"mail_{i}@gmail.com"
            },
            "content": f"Content for note {i}"
        }
        notes.append(note)
    
    data = {"notes": notes}
    
    with open('notes.json', 'w') as json_file:
        json.dump(data, json_file, indent=4)

if __name__ == "__main__":
    n = int(input("Enter the number of notes: "))
    generate_notes(n)
