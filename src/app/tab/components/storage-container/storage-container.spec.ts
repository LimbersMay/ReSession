import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StorageContainer } from './storage-container';

describe('StorageContainer', () => {
  let component: StorageContainer;
  let fixture: ComponentFixture<StorageContainer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StorageContainer]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StorageContainer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
